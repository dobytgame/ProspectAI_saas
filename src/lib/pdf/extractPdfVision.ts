import OpenAI from "openai";

const CHUNK_SIZE = 3;

/** Opções passadas ao construtor PDFParse (cMap, fontes, etc.). */
export type PdfParseLoadOptions = Record<string, unknown>;

/**
 * PDF escaneado / só imagem: renderiza páginas e transcreve com GPT-4o (visão).
 * Controlado por PDF_VISION_MAX_PAGES (default 8) e DISABLE_PDF_VISION=1 para desligar.
 */
export async function extractPdfTextViaVision(
  buffer: Buffer,
  loadOpts: PdfParseLoadOptions
): Promise<string | null> {
  if (process.env.DISABLE_PDF_VISION === "1") return null;
  if (!process.env.OPENAI_API_KEY?.trim()) return null;

  const maxPages = Math.min(
    Math.max(1, parseInt(process.env.PDF_VISION_MAX_PAGES || "8", 10) || 8),
    20
  );

  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({
    data: new Uint8Array(buffer),
    ...loadOpts,
  });

  let dataUrls: string[] = [];

  try {
    const shot = await parser.getScreenshot({
      first: maxPages,
      desiredWidth: 1200,
      imageDataUrl: true,
      imageBuffer: false,
    });
    dataUrls = shot.pages.map((p) => p.dataUrl).filter((u) => u.startsWith("data:image"));
  } finally {
    await parser.destroy();
  }

  if (dataUrls.length === 0) return null;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const parts: string[] = [];

  for (let i = 0; i < dataUrls.length; i += CHUNK_SIZE) {
    const chunk = dataUrls.slice(i, i + CHUNK_SIZE);
    const startPage = i + 1;

    const userContent: OpenAI.Chat.ChatCompletionContentPart[] = [
      {
        type: "text",
        text:
          `Transcreva TODO o texto visível nesta(s) ${chunk.length} imagem(ns) de documento (página(s) ${startPage} em diante, na ordem das imagens).\n` +
          `Regras: mantenha o idioma original; preserve títulos e listas quando possível; não invente conteúdo.\n` +
          `Se uma página não tiver texto legível, escreva apenas: [sem texto legível] para essa parte.\n` +
          `Responda só com a transcrição, sem introdução.`,
      },
    ];

    for (const url of chunk) {
      userContent.push({
        type: "image_url",
        image_url: { url, detail: "high" },
      });
    }

    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: userContent }],
      max_tokens: 8192,
    });

    const block = res.choices[0]?.message?.content?.trim();
    if (block) parts.push(block);
  }

  const text = parts
    .join("\n\n")
    .replace(/\[sem texto legível\]\s*/gi, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();

  return text.length > 0 ? text : null;
}

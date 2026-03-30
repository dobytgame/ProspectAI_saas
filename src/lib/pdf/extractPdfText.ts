import path from "node:path";
import { pathToFileURL } from "node:url";

import { extractPdfTextViaVision } from "@/lib/pdf/extractPdfVision";

/**
 * Caminhos file:// para CMaps do pdfjs-dist — sem isso, vários PDFs em Node extraem vazio.
 */
function getPdfJsFileUrls(): { cMapUrl: string } {
  const root = path.join(process.cwd(), "node_modules", "pdfjs-dist");
  const cMapUrl = pathToFileURL(path.join(root, "cmaps") + path.sep).href;
  return { cMapUrl };
}

/**
 * Extrai texto de PDF com pdf-parse v2.
 *
 * Importante: sem `pageJoiner: ''`, a lib aplica setDefaultParseParameters no mesmo
 * objeto `params` e preenche pageJoiner com "-- 1 of N --", poluindo o texto.
 */
function normalizePdfExtract(
  textResult: { pages: Array<{ text?: string }>; text?: string }
): { text: string; letterWords: number } {
  const raw = textResult.pages
    .map((p) => (p.text || "").trim())
    .filter(Boolean)
    .join("\n\n");

  let text = raw || (textResult.text || "").trim();

  text = text
    .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  const letterWords =
    text.match(/[A-Za-zÀ-ÿ]{3,}/g)?.length ??
    text.split(/\s+/).filter((w) => w.replace(/\d/g, "").length >= 3).length;

  return { text, letterWords };
}

function scoreExtract(t: string): number {
  const lw = t.match(/[A-Za-zÀ-ÿ]{3,}/g)?.length ?? 0;
  return t.replace(/\s/g, "").length + lw * 10;
}

/**
 * Fallback: pdf.js direto (mesmo motor, opções explícitas para Node).
 */
async function extractWithPdfJsDist(buffer: Buffer): Promise<{ text: string; letterWords: number }> {
  const { cMapUrl } = getPdfJsFileUrls();
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    cMapUrl,
    cMapPacked: true,
    useSystemFonts: true,
    disableFontFace: true,
    isEvalSupported: false,
    verbosity: 0,
  });

  const doc = await loadingTask.promise;
  const parts: string[] = [];

  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const line: string[] = [];
      for (const item of content.items) {
        if (item && typeof item === "object" && "str" in item && typeof (item as { str: string }).str === "string") {
          line.push((item as { str: string }).str);
        }
      }
      const pageText = line.join(" ").trim();
      if (pageText) parts.push(pageText);
      page.cleanup();
    }
  } finally {
    await doc.destroy();
  }

  const text = parts.join("\n\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  const letterWords =
    text.match(/[A-Za-zÀ-ÿ]{3,}/g)?.length ??
    text.split(/\s+/).filter((w) => w.replace(/\d/g, "").length >= 3).length;

  return { text, letterWords };
}

export async function extractPdfPlainText(buffer: Buffer): Promise<{
  text: string;
  letterWords: number;
}> {
  const { PDFParse } = await import("pdf-parse");
  const loadOpts = {
    ...getPdfJsFileUrls(),
    useSystemFonts: true,
    disableFontFace: true,
    isEvalSupported: false,
    verbosity: 0,
  };

  const parser = new PDFParse({
    data: new Uint8Array(buffer),
    ...loadOpts,
  });

  let best: { text: string; letterWords: number } = { text: "", letterWords: 0 };

  try {
    const baseOpts = {
      pageJoiner: "",
      itemJoiner: " ",
      parseHyperlinks: true,
      includeMarkedContent: false,
    } as const;

    let textResult = await parser.getText({
      ...baseOpts,
      lineEnforce: true,
    });
    const out = normalizePdfExtract(textResult);
    if (scoreExtract(out.text) > scoreExtract(best.text)) best = out;

    if (out.letterWords < 40 && out.text.replace(/\s/g, "").length > 40) {
      textResult = await parser.getText({
        ...baseOpts,
        lineEnforce: false,
      });
      const second = normalizePdfExtract(textResult);
      if (scoreExtract(second.text) > scoreExtract(best.text)) best = second;
    }

    if (scoreExtract(best.text) < 120) {
      try {
        const raw = await extractWithPdfJsDist(buffer);
        if (scoreExtract(raw.text) > scoreExtract(best.text)) best = raw;
      } catch (e) {
        console.warn("extractPdfPlainText: fallback pdfjs-dist falhou", e);
      }
    }
  } finally {
    await parser.destroy();
  }

  // PDF escaneado: transcrever páginas renderizadas com visão (OpenAI)
  if (best.text.trim().length < 80 || best.letterWords < 12) {
    try {
      const visionText = await extractPdfTextViaVision(buffer, loadOpts);
      if (visionText && scoreExtract(visionText) > scoreExtract(best.text)) {
        const letterWords =
          visionText.match(/[A-Za-zÀ-ÿ]{3,}/g)?.length ??
          visionText.split(/\s+/).filter((w) => w.replace(/\d/g, "").length >= 3).length;
        return { text: visionText, letterWords };
      }
    } catch (e) {
      console.warn("extractPdfPlainText: fallback visão (GPT-4o) falhou", e);
    }
  }

  return best;
}

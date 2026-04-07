import { extractText } from "unpdf";

import { extractPdfTextViaVision } from "@/lib/pdf/extractPdfVision";

function normalizeExtractedText(raw: string): { text: string; letterWords: number } {
  let text = raw
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
 * Extrai texto de PDF em ambiente serverless (Vercel) usando `unpdf`
 * (PDF.js empacotado para Node, sem `pdf-parse` / legacy pdfjs + DOMMatrix).
 * PDF escaneado: fallback opcional com GPT-4o via `extractPdfTextViaVision` (+ `@napi-rs/canvas`).
 */
export async function extractPdfPlainText(buffer: Buffer): Promise<{
  text: string;
  letterWords: number;
}> {
  const uint8 = new Uint8Array(buffer);

  const { text: perPage } = await extractText(uint8, { mergePages: false });

  const raw = Array.isArray(perPage)
    ? perPage.map((p) => (p || "").trim()).filter(Boolean).join("\n\n")
    : String(perPage ?? "").trim();

  const best = normalizeExtractedText(raw);

  if (best.text.trim().length < 80 || best.letterWords < 12) {
    try {
      const visionText = await extractPdfTextViaVision(buffer);
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

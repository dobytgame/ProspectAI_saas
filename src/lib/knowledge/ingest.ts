import axios from "axios";
import { extractPdfPlainText } from "@/lib/pdf/extractPdfText";

export function isWordProcessorFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return (
    file.type === "application/msword" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".doc") ||
    lower.endsWith(".docx")
  );
}

export async function fetchUrlPlainText(url: string, maxLen = 50000): Promise<string> {
  const response = await axios.get(url.trim(), {
    timeout: 12000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  const html = response.data as string;
  let cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  cleanHtml = cleanHtml.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  return cleanHtml
    .replace(/<[^>]*>?/gm, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, maxLen);
}

/** Extrai texto de um arquivo (PDF ou texto). Lança se não suportado. */
export async function extractTextFromFileBuffer(
  file: File,
  buffer: Buffer
): Promise<{ text: string; letterWords: number }> {
  if (isWordProcessorFile(file)) {
    throw new Error(
      "Arquivos .doc/.docx não são suportados. Exporte como PDF ou salve em .txt."
    );
  }
  if (file.type === "application/pdf") {
    const { text, letterWords } = await extractPdfPlainText(buffer);
    const t = text.replace(/\s+/g, " ").trim();
    if (letterWords < 25 && t.length >= 50) {
      throw new Error(
        "O PDF tem pouco texto selecionável (pode ser escaneado como imagem). " +
          "Exporte um PDF com texto (Word/Google Docs → PDF) ou cole o conteúdo em um arquivo .txt."
      );
    }
    return { text: t, letterWords };
  }
  const t = buffer.toString("utf-8").trim();
  const letterWords =
    t.match(/[A-Za-zÀ-ÿ]{3,}/g)?.length ??
    t.split(/\s+/).filter((w) => w.replace(/\d/g, "").length >= 3).length;
  return { text: t, letterWords };
}

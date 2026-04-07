import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { analyzeKnowledgeSource } from "@/lib/ai/claude";
import { extractPdfPlainText } from "@/lib/pdf/extractPdfText";
import { clearOnboardingKbSkippedFlag } from "@/lib/business/metadata-flags";
import axios from "axios";

export const runtime = "nodejs";

const KNOWLEDGE_BUCKET = "knowledge_base";

async function uploadKnowledgeFileToStorage(args: {
  businessId: string;
  kbId: string;
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}): Promise<Record<string, unknown>> {
  const { businessId, kbId, buffer, originalName, mimeType } = args;
  const safeName =
    originalName.replace(/[^\w.\-]+/g, "_").replace(/^\.+/, "").slice(0, 160) || "file";
  const storagePath = `${businessId}/${kbId}/${Date.now()}-${safeName}`;
  try {
    const admin = createServiceRoleClient();
    const { error } = await admin.storage.from(KNOWLEDGE_BUCKET).upload(storagePath, buffer, {
      contentType: mimeType || "application/octet-stream",
      upsert: false,
    });
    if (error) {
      console.error("knowledge storage upload:", error.message);
      return { storage_upload_error: error.message };
    }
    return {
      storage_path: storagePath,
      storage_bucket: KNOWLEDGE_BUCKET,
      original_filename: originalName,
      mime_type: mimeType,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("knowledge storage:", e);
    return { storage_upload_error: msg };
  }
}

function isWordProcessorFile(file: File): boolean {
  const lower = file.name.toLowerCase();
  return (
    file.type === "application/msword" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".doc") ||
    lower.endsWith(".docx")
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const businessId = formData.get("business_id") as string;
    const type = formData.get("type") as string;
    const url = formData.get("url") as string;
    const file = formData.get("file") as File | null;

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("id", businessId)
      .eq("user_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Business not found or unauthorized" }, { status: 404 });
    }

    if (type === "manual") {
      const manualText = ((formData.get("manual_text") as string) || "").trim();
      if (manualText.length < 20) {
        return NextResponse.json(
          { error: "Escreva pelo menos 20 caracteres sobre seu negócio." },
          { status: 400 }
        );
      }
      if (manualText.length > 50000) {
        return NextResponse.json(
          { error: "Texto muito longo. Use no máximo 50 mil caracteres." },
          { status: 400 }
        );
      }

      const { data: kbRecord, error: manualInsertError } = await supabase
        .from("knowledge_bases")
        .insert({
          business_id: business.id,
          type: "manual",
          source: "Descrição manual",
          status: "completed",
          content: manualText.substring(0, 10000),
          ai_feedback: manualText.substring(0, 12000),
          metadata: { origin: "onboarding_manual" },
        })
        .select()
        .single();

      if (manualInsertError) {
        console.error("Manual KB insert:", manualInsertError);
        return NextResponse.json({ error: "Não foi possível salvar o texto." }, { status: 500 });
      }

      await clearOnboardingKbSkippedFlag(supabase, business.id);

      return NextResponse.json({ success: true, record: kbRecord });
    }

    if (type === "file" && (!file || !(file instanceof File) || file.size === 0)) {
      return NextResponse.json({ error: "Selecione um arquivo válido." }, { status: 400 });
    }

    if (type === "url" && !url?.trim()) {
      return NextResponse.json({ error: "Informe uma URL." }, { status: 400 });
    }

    const sourceName = type === "url" ? url.trim() : (file as File).name;
    const dbType =
      type === "url" ? "url" : (file as File).type === "application/pdf" ? "pdf" : "text";

    const { data: kbRecord, error: insertError } = await supabase
      .from("knowledge_bases")
      .insert({
        business_id: business.id,
        type: dbType,
        source: sourceName,
        status: "processing",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting KB:", insertError);
      return NextResponse.json({ error: "Failed to create knowledge record" }, { status: 500 });
    }

    let storageMeta: Record<string, unknown> = {};

    try {
      let extractedText = "";

      if (type === "url" && url) {
        const response = await axios.get(url.trim(), {
          timeout: 10000,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });
        const html = response.data;

        let cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
        cleanHtml = cleanHtml.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

        extractedText = cleanHtml
          .replace(/<[^>]*>?/gm, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .substring(0, 50000);
      } else if (type === "file" && file) {
        if (isWordProcessorFile(file)) {
          throw new Error(
            "Arquivos .doc/.docx ainda não são lidos automaticamente. Exporte como PDF ou salve o texto em um arquivo .txt."
          );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        storageMeta = await uploadKnowledgeFileToStorage({
          businessId: business.id,
          kbId: kbRecord.id,
          buffer,
          originalName: file.name,
          mimeType: file.type || "application/octet-stream",
        });

        if (file.type === "application/pdf") {
          try {
            const { text, letterWords } = await extractPdfPlainText(buffer);
            extractedText = text.replace(/\s+/g, " ").trim().substring(0, 50000);

            if (letterWords < 25 && extractedText.length >= 50) {
              throw new Error(
                "O PDF tem pouco texto selecionável (pode ser escaneado como imagem). " +
                  "Exporte um PDF com texto (Word/Google Docs → PDF) ou cole o conteúdo em um arquivo .txt."
              );
            }
          } catch (pdfErr: unknown) {
            const msg = pdfErr instanceof Error ? pdfErr.message : "Formato não suportado";
            console.error("PDF Parse error:", pdfErr);
            throw new Error(`Erro ao ler PDF: ${msg}`);
          }
        } else {
          extractedText = buffer.toString("utf-8").trim().substring(0, 50000);
        }
      }

      if (!extractedText || extractedText.trim().length < 50) {
        if (dbType === "pdf") {
          throw new Error(
            "Não foi possível extrair texto deste PDF. Provável causa: arquivo só com imagens (escaneado) ou fontes não embutidas. " +
              "Soluções: exportar de novo como PDF com texto selecionável (Word/Google Docs), usar “OCR” no Acrobat, ou enviar um .txt com o conteúdo."
          );
        }
        throw new Error(
          "Não foi possível extrair conteúdo suficiente desta fonte. Verifique a URL ou use um documento com texto legível."
        );
      }

      const analysis = await analyzeKnowledgeSource(extractedText, business.name, dbType);

      const { data: updatedRecord, error: updateError } = await supabase
        .from("knowledge_bases")
        .update({
          content: extractedText.substring(0, 10000),
          ai_feedback: analysis.insight,
          metadata: { confidence: analysis.confidence, ...storageMeta },
          status: "completed",
        })
        .eq("id", kbRecord.id)
        .select()
        .single();

      if (updateError) throw updateError;

      await clearOnboardingKbSkippedFlag(supabase, business.id);

      return NextResponse.json({ success: true, analysis, record: updatedRecord });
    } catch (processError: unknown) {
      const message =
        processError instanceof Error ? processError.message : "Erro desconhecido ao processar";
      console.error("Error processing KB:", processError);

      const failPatch: Record<string, string | Record<string, unknown>> = {
        status: "failed",
        ai_feedback: message,
      };
      if (Object.keys(storageMeta).length) {
        failPatch.metadata = storageMeta;
      }

      const { data: failedRecord } = await supabase
        .from("knowledge_bases")
        .update(failPatch)
        .eq("id", kbRecord.id)
        .select()
        .single();

      return NextResponse.json(
        {
          error: message,
          record: failedRecord || kbRecord,
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno";
    console.error("KB Add Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

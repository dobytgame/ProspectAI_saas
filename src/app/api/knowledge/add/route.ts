import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { analyzeKnowledgeSource } from "@/lib/ai/claude";
import { clearOnboardingKbSkippedFlag } from "@/lib/business/metadata-flags";
import {
  extractTextFromFileBuffer,
  fetchUrlPlainText,
  isWordProcessorFile,
} from "@/lib/knowledge/ingest";
import { uploadKnowledgeAsset } from "@/lib/knowledge/storage-upload";

export const runtime = "nodejs";

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
        extractedText = await fetchUrlPlainText(url);
      } else if (type === "file" && file) {
        if (isWordProcessorFile(file)) {
          throw new Error(
            "Arquivos .doc/.docx ainda não são lidos automaticamente. Exporte como PDF ou salve o texto em um arquivo .txt."
          );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        storageMeta = await uploadKnowledgeAsset({
          storagePrefix: `${business.id}/${kbRecord.id}`,
          buffer,
          originalName: file.name,
          mimeType: file.type || "application/octet-stream",
        });

        try {
          const { text } = await extractTextFromFileBuffer(file, buffer);
          extractedText = text.substring(0, 50000);
        } catch (pdfErr: unknown) {
          const msg = pdfErr instanceof Error ? pdfErr.message : "Formato não suportado";
          console.error("File extract error:", pdfErr);
          throw new Error(msg.startsWith("Erro") ? msg : `Erro ao ler arquivo: ${msg}`);
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

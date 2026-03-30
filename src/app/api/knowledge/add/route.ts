import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { analyzeKnowledgeSource } from "@/lib/ai/claude";
import { extractPdfPlainText } from "@/lib/pdf/extractPdfText";
import axios from "axios";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const businessId = formData.get("business_id") as string;
    const type = formData.get("type") as string; // 'url' or 'file'
    const url = formData.get("url") as string;
    const file = formData.get("file") as File;

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    // Verify business ownership
    const { data: business } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("id", businessId)
      .eq("user_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Business not found or unauthorized" }, { status: 404 });
    }

    let sourceName = "";
    let extractedText = "";
    
    // 1. Inserir no banco como 'processing'
    sourceName = type === 'url' ? url : file.name;
    const dbType = type === 'url' ? 'url' : (file.type === 'application/pdf' ? 'pdf' : 'text');

    const { data: kbRecord, error: insertError } = await supabase
      .from("knowledge_bases")
      .insert({
        business_id: business.id,
        type: dbType,
        source: sourceName,
        status: 'processing',
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting KB:", insertError);
      return NextResponse.json({ error: "Failed to create knowledge record" }, { status: 500 });
    }

    // 2. Extrair Conteúdo Paralelamente e gerar Feedback
    // (Não paramos a requisição se demorar muito, mas Serverless functions tem timeout em 10-60s dependendo do host.
    // O ideal seria Background Jobs, mas por simplicidade no MVP, vamos processar sincrono e retornar.)
    
    try {
      if (type === 'url' && url) {
        const response = await axios.get(url, { 
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        const html = response.data;
        
        // Remove script and style tags and their contents
        let cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        cleanHtml = cleanHtml.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
        
        // Extract text and clean up whitespace
        extractedText = cleanHtml.replace(/<[^>]*>?/gm, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 50000);
      } else if (type === 'file' && file) {
        const buffer = Buffer.from(await file.arrayBuffer());
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
          extractedText = buffer.toString("utf-8");
        }
        
        // Opcional: Salvar o arquivo no bucket Supabase
        const filePath = `${business.id}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
        await supabase.storage.from("knowledge_base").upload(filePath, file);
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

      // 3. Analisar com a IA
      const analysis = await analyzeKnowledgeSource(extractedText, business.name, dbType);

      // 4. Salvar conclusão e retornar o registro atualizado
      const { data: updatedRecord, error: updateError } = await supabase
        .from("knowledge_bases")
        .update({
          content: extractedText.substring(0, 10000), // Saving a truncated version for history
          ai_feedback: analysis.insight,
          metadata: { confidence: analysis.confidence },
          status: 'completed'
        })
        .eq("id", kbRecord.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return NextResponse.json({ success: true, analysis, record: updatedRecord });
      
    } catch (processError: any) {
      console.error("Error processing KB:", processError);
      // Mark as failed
      const { data: failedRecord } = await supabase
        .from("knowledge_bases")
        .update({
          status: 'failed',
          ai_feedback: processError.message || "Erro desconhecido ao processar",
        })
        .eq("id", kbRecord.id)
        .select()
        .single();

      return NextResponse.json({ 
        error: processError.message || "Failed to process knowledge source", 
        record: failedRecord || kbRecord 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error("KB Add Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

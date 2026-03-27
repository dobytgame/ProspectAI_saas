import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { analyzeKnowledgeSource } from "@/lib/ai/claude";
import axios from "axios";

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
          const pdfParse = require("pdf-parse");
          const result = await pdfParse(buffer);
          extractedText = result.text;
        } else {
          extractedText = buffer.toString("utf-8");
        }
        
        // Opcional: Salvar o arquivo no bucket Supabase
        const filePath = `${business.id}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
        await supabase.storage.from("knowledge_base").upload(filePath, file);
      }

      if (!extractedText || extractedText.trim().length < 50) {
        throw new Error("Não foi possível extrair conteúdo suficiente deste site ou documento. Verifique se a URL está correta ou se o arquivo contém texto legível.");
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

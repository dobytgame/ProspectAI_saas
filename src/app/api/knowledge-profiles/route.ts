import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { synthesizeCampaignKnowledgeProfile } from "@/lib/ai/claude";
import {
  extractTextFromFileBuffer,
  fetchUrlPlainText,
  isWordProcessorFile,
} from "@/lib/knowledge/ingest";
import { removeKnowledgeStoragePaths, uploadKnowledgeAsset } from "@/lib/knowledge/storage-upload";
import { checkLimit, PlanType } from "@/utils/plan-limits";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let uploadedPaths: string[] = [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const businessId = (formData.get("business_id") as string)?.trim();
    const name = ((formData.get("name") as string) || "").trim();
    const openText = ((formData.get("open_text") as string) || "").trim();
    const url = ((formData.get("url") as string) || "").trim();
    const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

    if (!businessId) {
      return NextResponse.json({ error: "Business ID é obrigatório." }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "Nome do perfil é obrigatório." }, { status: 400 });
    }
    if (files.length > 3) {
      return NextResponse.json({ error: "Máximo 3 arquivos por perfil." }, { status: 400 });
    }
    if (openText.length > 50000) {
      return NextResponse.json({ error: "Texto muito longo (máx. 50 mil caracteres)." }, { status: 400 });
    }

    if (openText.length > 0 && openText.length < 20 && !url && files.length === 0) {
      return NextResponse.json(
        { error: "Se usar só texto livre, escreva pelo menos 20 caracteres." },
        { status: 400 }
      );
    }
    if (!url && files.length === 0 && openText.length < 20) {
      return NextResponse.json(
        { error: "Informe texto (mín. 20 caracteres), uma URL ou pelo menos um arquivo." },
        { status: 400 }
      );
    }

    const { data: business, error: bizErr } = await supabase
      .from("businesses")
      .select("id, name, plan")
      .eq("id", businessId)
      .eq("user_id", user.id)
      .single();

    if (bizErr || !business) {
      return NextResponse.json({ error: "Negócio não encontrado." }, { status: 404 });
    }

    const plan = (business.plan || "free") as PlanType;
    const { count } = await supabase
      .from("knowledge_profiles")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business.id);

    const limitCheck = checkLimit(count || 0, plan, "maxKnowledgeProfiles");
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: "VOCE_ATINGIU_O_LIMITE_DE_PERFIS_DE_CONHECIMENTO_DO_SEU_PLANO" },
        { status: 403 }
      );
    }

    const { data: row, error: insErr } = await supabase
      .from("knowledge_profiles")
      .insert({
        business_id: business.id,
        name,
        status: "processing",
      })
      .select()
      .single();

    if (insErr || !row) {
      console.error("knowledge_profiles insert:", insErr);
      return NextResponse.json({ error: "Não foi possível criar o perfil." }, { status: 500 });
    }

    const parts: string[] = [];
    if (openText.length >= 20) {
      parts.push(`=== Texto fornecido pelo usuário ===\n${openText.slice(0, 20000)}`);
    }

    if (url) {
      try {
        const siteText = await fetchUrlPlainText(url, 50000);
        parts.push(`=== Conteúdo extraído do site ${url} ===\n${siteText.slice(0, 20000)}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "URL inválida";
        await removeKnowledgeStoragePaths(uploadedPaths);
        await supabase
          .from("knowledge_profiles")
          .update({ status: "failed", ai_feedback: `URL: ${msg}` })
          .eq("id", row.id);
        return NextResponse.json({ error: `Não foi possível ler a URL: ${msg}` }, { status: 400 });
      }
    }

    const uploadsMeta: Record<string, unknown>[] = [];

    for (const file of files) {
      if (isWordProcessorFile(file)) {
        await removeKnowledgeStoragePaths(uploadedPaths);
        await supabase
          .from("knowledge_profiles")
          .update({
            status: "failed",
            ai_feedback: "Arquivos .doc/.docx não são suportados. Use PDF ou .txt.",
            metadata: { uploads: uploadsMeta },
          })
          .eq("id", row.id);
        return NextResponse.json(
          { error: "Arquivos .doc/.docx não são suportados. Exporte como PDF ou .txt." },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const meta = await uploadKnowledgeAsset({
        storagePrefix: `${business.id}/kp_${row.id}`,
        buffer,
        originalName: file.name,
        mimeType: file.type || "application/octet-stream",
      });
      uploadsMeta.push(meta);
      if (typeof meta.storage_path === "string") {
        uploadedPaths.push(meta.storage_path);
      }

      try {
        const { text } = await extractTextFromFileBuffer(file, buffer);
        parts.push(`=== Arquivo: ${file.name} ===\n${text.slice(0, 20000)}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await removeKnowledgeStoragePaths(uploadedPaths);
        await supabase
          .from("knowledge_profiles")
          .update({
            status: "failed",
            ai_feedback: msg,
            metadata: { uploads: uploadsMeta },
          })
          .eq("id", row.id);
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }

    const combined = parts.join("\n\n").replace(/\s+/g, " ").trim().slice(0, 48000);
    if (combined.replace(/\s/g, "").length < 80) {
      await removeKnowledgeStoragePaths(uploadedPaths);
      await supabase
        .from("knowledge_profiles")
        .update({
          status: "failed",
          ai_feedback: "Conteúdo insuficiente após processar as fontes.",
          metadata: { uploads: uploadsMeta },
        })
        .eq("id", row.id);
      return NextResponse.json(
        { error: "Conteúdo insuficiente nas fontes fornecidas." },
        { status: 400 }
      );
    }

    let synthesized;
    try {
      synthesized = await synthesizeCampaignKnowledgeProfile(combined, business.name, name);
    } catch (aiErr) {
      const msg = aiErr instanceof Error ? aiErr.message : "Falha na IA";
      await removeKnowledgeStoragePaths(uploadedPaths);
      await supabase
        .from("knowledge_profiles")
        .update({
          status: "failed",
          ai_feedback: msg,
          metadata: { uploads: uploadsMeta },
        })
        .eq("id", row.id);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const { data: updated, error: updErr } = await supabase
      .from("knowledge_profiles")
      .update({
        status: "completed",
        campaign_brief: synthesized.campaign_brief.slice(0, 20000),
        structured: {
          talking_points: synthesized.talking_points,
          value_props: synthesized.value_props,
          avoid: synthesized.avoid,
        },
        ai_feedback: synthesized.insight_summary,
        source_summary: `texto:${openText.length >= 20 ? 1 : 0} url:${url ? 1 : 0} arquivos:${files.length}`,
        metadata: {
          uploads: uploadsMeta,
          url: url || null,
          open_text_chars: openText.length,
        },
      })
      .eq("id", row.id)
      .select()
      .single();

    if (updErr) {
      console.error("knowledge_profiles update:", updErr);
      return NextResponse.json({ error: "Erro ao finalizar perfil." }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro interno";
    console.error("knowledge-profiles POST:", error);
    await removeKnowledgeStoragePaths(uploadedPaths);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

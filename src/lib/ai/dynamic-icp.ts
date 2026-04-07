import { createClient } from "@/utils/supabase/server";
import { openai, OPENAI_MODEL_FLAGSHIP } from "@/lib/ai/openai-client";

export async function updateLearnedICP(businessId: string) {
  const supabase = await createClient();

  // 1. Get recent successful leads
  const { data: closedLeads } = await supabase
    .from("leads")
    .select("*")
    .eq("business_id", businessId)
    .eq("status", "closed")
    .order("updated_at", { ascending: false })
    .limit(10);

  if (!closedLeads || closedLeads.length < 3) return; // Need some data to learn

  // 2. Format leads for AI
  const leadsContext = closedLeads.map((l) => ({
    name: l.name,
    segment: l.segment,
    score: l.score,
    reasoning: l.metadata?.reasoning,
  }));

  const userPrompt = `
    Você é um cientista de dados e especialista em ICP (Ideal Customer Profile).
    Sua tarefa é analisar o padrão dos leads que foram "FECHADOS" com sucesso e extrair insights.
    
    LEADS FECHADOS:
    ${JSON.stringify(leadsContext)}
    
    O QUE BUSCAR:
    - Quais segmentos estão convertendo melhor?
    - Quais dores (pain points) citadas no reasoning são comuns?
    - Qual o perfil de empresa ideal que devemos priorizar?
    
    RETORNO:
    Retorne apenas um objeto JSON com:
    {
      "top_segments": [],
      "winning_arguments": [],
      "ideal_profile_summary": "resumo de 2 frases"
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL_FLAGSHIP,
      messages: [
        {
          role: "system",
          content:
            "Você responde somente com JSON válido, sem markdown, seguindo o schema pedido pelo usuário.",
        },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const text = response.choices[0]?.message?.content;
    if (!text) return;

    const insights = JSON.parse(text) as {
      top_segments?: unknown;
      winning_arguments?: unknown;
      ideal_profile_summary?: string;
    };

    const { data: row } = await supabase
      .from("businesses")
      .select("metadata")
      .eq("id", businessId)
      .single();

    const prevMeta =
      row?.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {};

    await supabase
      .from("businesses")
      .update({
        metadata: {
          ...prevMeta,
          learned_icp: insights,
          last_icp_update: new Date().toISOString(),
        },
      })
      .eq("id", businessId);

    return insights;
  } catch (error) {
    console.error("Dynamic ICP Error:", error);
  }
}

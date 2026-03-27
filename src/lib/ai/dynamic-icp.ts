import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export async function updateLearnedICP(businessId: string) {
  const supabase = await createClient()

  // 1. Get recent successful leads
  const { data: closedLeads } = await supabase
    .from("leads")
    .select("*")
    .eq("business_id", businessId)
    .eq("status", "closed")
    .order("updated_at", { ascending: false })
    .limit(10)

  if (!closedLeads || closedLeads.length < 3) return // Need some data to learn

  // 2. Format leads for AI
  const leadsContext = closedLeads.map(l => ({
    name: l.name,
    segment: l.segment,
    score: l.score,
    reasoning: l.metadata?.reasoning
  }))

  const systemPrompt = `
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
  `

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: "Analise os padrões e gere o ICP aprendido." }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const insights = JSON.parse(content.text);
      
      // 3. Update business metadata or learned_icp field
      await supabase
        .from("businesses")
        .update({ 
          metadata: { 
            learned_icp: insights,
            last_icp_update: new Date().toISOString()
          } 
        })
        .eq("id", businessId);
        
      return insights;
    }
  } catch (error) {
    console.error("Dynamic ICP Error:", error);
  }
}

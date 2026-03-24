import { NextResponse } from 'next/server'
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { message, leadId } = await req.json()
    const supabase = await createClient()

    // 1. Get Lead and Business details
    const { data: lead } = await supabase
      .from("leads")
      .select("*, businesses(*, agents(*))")
      .eq("id", leadId)
      .single()

    if (!lead) return NextResponse.json({ reply: "Lead não encontrado." })

    const business = lead.businesses
    const agent = business.agents?.[0]

    // 2. Prepare Context
    const systemPrompt = `
      Você é o Agente ProspectAI, um assessor comercial altamente experiente.
      Seu objetivo é ajudar o usuário a prospectar a empresa: ${lead.name}.
      
      CONTEXTO DO SEU TRABALHO:
      - Empresa do Usuário: ${business.name}
      - Nicho: ${business.segment}
      - Tom de Voz: ${business.tone}
      - ICP: ${JSON.stringify(business.icp)}
      
      DADOS DO LEAD:
      - Nome: ${lead.name}
      - Endereço: ${lead.address}
      - Score de Qualificação: ${lead.score}/100
      - Razão da Nota: ${lead.metadata?.reasoning}
      
      INSTRUÇÕES:
      - Seja consultivo, direto e profissional conforme o tom de voz.
      - Ajude o usuário a criar o script perfeito para o primeiro contato.
      - Sugira se o contato deve ser por WhatsApp, E-mail ou Visita, baseado no score.
    `;

    // 3. Call Claude
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: message }],
    });

    const content = response.content[0];
    const reply = content.type === "text"
      ? content.text
      : "Não consegui gerar uma resposta.";

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json({ reply: "Erro ao processar conversa." }, { status: 500 })
  }
}

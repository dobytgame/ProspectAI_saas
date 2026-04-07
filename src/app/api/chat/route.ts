import { NextResponse } from "next/server";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { createClient } from "@/utils/supabase/server";
import { openai, OPENAI_MODEL_FLAGSHIP } from "@/lib/ai/openai-client";
import {
  formatProspectingVoiceForPrompt,
  prospectingVoiceFromBusinessMetadata,
} from "@/lib/voice/prospecting-voice";

export async function POST(req: Request) {
  try {
    const { message, leadId, history = [] } = await req.json();
    const supabase = await createClient();

    const { data: lead } = await supabase
      .from("leads")
      .select("*, business:businesses(*, agents(config))")
      .eq("id", leadId)
      .single();

    if (!lead) return NextResponse.json({ reply: "Lead não encontrado." });

    const business = lead.business;
    const agentConfig = business?.agents?.[0]?.config || {};
    const voice = prospectingVoiceFromBusinessMetadata(business?.metadata);
    const voiceBlock = formatProspectingVoiceForPrompt(voice, business.name);

    const systemPrompt = `
      Você é o Agente Capturo, um assessor comercial altamente experiente.
      Seu objetivo é ajudar o usuário a prospectar a empresa: ${lead.name}.
      
      CONTEXTO DO SEU TRABALHO:
      - Empresa do Usuário: ${business.name}
      - Nicho: ${business.segment}
      - Tom de Voz (legado): ${business.tone}
      - Persona de Vendas: ${JSON.stringify(agentConfig.sales_persona || {})}
      - ICP Completo: ${JSON.stringify(agentConfig.icp || {})}
      - Objeções Mapeadas: ${JSON.stringify(agentConfig.objection_handling || {})}

      ${voiceBlock}
      
      DADOS DO LEAD:
      - Nome: ${lead.name}
      - Endereço: ${lead.address}
      - Score de Qualificação: ${lead.score}/100
      - Razão da Nota: ${lead.metadata?.reasoning}
      - Avaliação: ${lead.metadata?.rating || "N/A"} estrelas
      
      INSTRUÇÕES:
      - Ao sugerir textos para o usuário enviar ao lead, siga o "TOM DE VOZ DA CONTA" acima.
      - Ajude o usuário a criar o script perfeito para o primeiro contato.
      - Sugira abordagens baseadas nos gatilhos de compra e pontos fracos (pain points).
    `;

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...history.slice(-10).map((h: { role: string; content: string }) => ({
        role: h.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: h.content,
      })),
      { role: "user", content: message },
    ];

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL_FLAGSHIP,
      max_tokens: 1000,
      temperature: 0.7,
      messages,
    });

    const reply =
      response.choices[0]?.message?.content?.trim() ||
      "Não consegui gerar uma resposta.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { reply: "Erro ao processar conversa." },
      { status: 500 }
    );
  }
}

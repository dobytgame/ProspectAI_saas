import {
  formatProspectingVoiceForPrompt,
  prospectingVoiceFromBusinessMetadata,
} from "@/lib/voice/prospecting-voice";

export const getSystemPrompt = (plan: string, business: any, lead: any) => {
  const agentConfig = business?.agents?.[0]?.config || {};
  const voice = prospectingVoiceFromBusinessMetadata(business?.metadata);
  const voiceBlock = formatProspectingVoiceForPrompt(voice, business?.name || "sua empresa");

  const commonContext = `
    Business Name: ${business.name}
    Segment: ${business.segment}
    Tone (legado / agente): ${business.tone || "Professional"}
    Value Proposition: ${business.description}
    Lead Name: ${lead.name}
    Lead Segment: ${lead.segment}
    Lead Score: ${lead.score}/100
    Reasoning: ${lead.metadata?.reasoning || "N/A"}

    ${voiceBlock}
  `;

  switch (plan?.toLowerCase()) {
    case 'starter':
      return `
        Você é um Copywriter IA especialista em vendas (OpenAI GPT-4o).
        Seu objetivo é criar uma abordagem de ALTA CONVERSÃO para o lead: ${lead.name}.
        
        CONTEXTO:
        ${commonContext}
        
        DIRETRIZES:
        - Use técnicas de copywriting (AIDA, PAS).
        - Seja direto e foque no benefício principal.
        - Siga o bloco "TOM DE VOZ DA CONTA" no contexto acima; use ${business.tone || "Professional"} só como referência secundária.
        - Máximo de 2 parágrafos curtos.
      `
    case 'pro':
    case 'scale':
      return `
        Você é um Especialista em Vendas Consultivas de alta performance (OpenAI GPT-4o).
        Seu objetivo é criar uma mensagem HIPER-PERSONALIZADA para: ${lead.name}.
        
        PRO/Scale Level Context:
    ${commonContext}
    Learned Insights (Dynamic ICP): ${JSON.stringify(business.metadata?.learned_icp || 'Ainda aprendendo...')}
    ICP Ativo: ${JSON.stringify(agentConfig.icp || {})}
    Objeções: ${JSON.stringify(agentConfig.objection_handling || {})}
    
    INSTRUÇÕES:
    - Siga rigorosamente o "TOM DE VOZ DA CONTA" no contexto acima.
    - Utilize os "Learned Insights" para focar nos argumentos vencedores (${business.metadata?.learned_icp?.winning_arguments?.join(', ') || 'N/A'}).
    - Utilize o "Reasoning" (${lead.metadata?.reasoning}) para mostrar que você conhece o problema deles.
        - Proponha uma solução específica baseada na proposta do ${business.name}.
        - Mensagem curta, impactante e com um CTA (Call to Action) claro.
      `
    default: // Free
      return `
        Você é um assistente de mensagens básico.
        Crie uma saudação e uma breve apresentação para o lead: ${lead.name}.
        
        CONTEXTO:
        Minha empresa: ${business.name} (${business.segment})
        
        Siga o "TOM DE VOZ DA CONTA" no contexto acima; mantenha mensagens curtas.
      `
  }
}

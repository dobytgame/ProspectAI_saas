import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// Helper para extrair JSON limpo do response do Claude
function parseClaudeJSON(text: string): any {
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ────────────────────────────────────────────
// Sprint 2: Funções base
// ────────────────────────────────────────────

export async function extractBusinessProfile(description: string) {
  const prompt = `
    Analise os dados do negócio abaixo e extraia o ICP (Perfil de Cliente Ideal) e o Tom de Voz sugerido para as mensagens de prospecção.
    Estes dados podem incluir uma descrição direta, conteúdo de um website ou texto de um documento.
    
    DADOS DO NEGÓCIO:
    "${description}"
    
    Retorne APENAS um JSON no seguinte formato:
    {
      "icp": {
        "target_audience": "string",
        "pain_points": ["string"],
        "solution_value": "string"
      },
      "suggested_tone": "string (ex: Formal, Amigável, Consultivo, Autoritário)",
      "niche": "string"
    }
  `;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type === "text") {
    try {
      return parseClaudeJSON(content.text);
    } catch (e) {
      console.error("Failed to parse Claude response:", content.text);
      throw new Error("Falha ao processar perfil do negócio com IA.");
    }
  }
  
  throw new Error("Resposta inesperada da IA.");
}

export async function generateOutreachMessage(
  lead: any,
  business: any,
  campaign: any
) {
  const isWhatsApp = campaign.channel === 'whatsapp';

  const prompt = `Você é ${business.name}, uma empresa de ${business.segment}.
Tom de voz: ${business.tone}
ICP: ${JSON.stringify(business.icp)}

Escreva uma mensagem de PRIMEIRO contato para o lead abaixo.
Canal: ${campaign.channel.toUpperCase()}
Campanha: ${campaign.name} — ${campaign.description}

LEAD:
- Nome: ${lead.name}
- Endereço: ${lead.address}
- Avaliação Google: ${lead.metadata?.rating || 'N/A'} estrelas
- Score de qualificação: ${lead.score}/100
- Por que é um bom lead: ${lead.metadata?.reasoning || ''}
${lead.phone ? `- Telefone: ${lead.phone}` : ''}
${lead.website ? `- Website: ${lead.website}` : ''}

REGRAS ABSOLUTAS:
- ${isWhatsApp ? 'Máximo 3 parágrafos curtos, tom amigável, sem markdown' : 'Inclua ASSUNTO: na primeira linha, máximo 4 parágrafos'}
- Primeira frase deve mencionar algo específico sobre o negócio ou localização
- Nunca use: "espero que esteja bem", "venho por meio desta"
- Nunca mencione automação ou IA
- Termine com: ${business.name}

Escreva APENAS a mensagem final, sem comentários.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 800,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type === "text") return content.text;
  throw new Error("Falha ao gerar mensagem de abordagem.");
}

// ────────────────────────────────────────────
// Sprint 3: Prompts avançados & qualidade
// ────────────────────────────────────────────

/**
 * 3.1 — Treinamento estruturado do agente.
 * Retorna JSON rico com scoring_criteria, approach_angles e mais.
 */
export async function trainAgent(businessData: {
  name: string;
  description: string;
  services: string;
  targetAudience: string;
  differentials: string;
  tone: string;
  extraContext?: string;
}) {
  const prompt = `Você é um especialista em estratégia de vendas B2B.
Analise o perfil do negócio abaixo e configure um agente de prospecção de alta performance.

PERFIL:
Nome: ${businessData.name}
Descrição: ${businessData.description}
Serviços: ${businessData.services}
Público-alvo: ${businessData.targetAudience}
Diferenciais: ${businessData.differentials}
Tom: ${businessData.tone}
${businessData.extraContext ? `Contexto adicional:\n${businessData.extraContext}` : ''}

Retorne EXCLUSIVAMENTE JSON válido:
{
  "icp": {
    "target_audience": "string",
    "pain_points": ["string"],
    "solution_value": "string",
    "ideal_segments": ["string"],
    "disqualifiers": ["string"]
  },
  "suggested_tone": "string",
  "niche": "string",
  "approach_angles": ["string"],
  "scoring_criteria": {
    "must_have": ["string"],
    "nice_to_have": ["string"],
    "red_flags": ["string"]
  }
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type === "text") {
    return parseClaudeJSON(content.text);
  }
  throw new Error("Falha ao treinar agente.");
}

/**
 * 3.2 — Scoring detalhado com tier, fit_reasons, concerns e priority.
 */
export async function scoreLead(leadData: any, businessICP: any) {
  const prompt = `Avalie o fit deste lead com o ICP do negócio. Score de 0-100.

ICP: ${JSON.stringify(businessICP)}

LEAD:
- Nome: ${leadData.name}
- Categorias: ${JSON.stringify(leadData.metadata?.types || [])}
- Avaliação: ${leadData.metadata?.rating || 'N/A'}/5
- Endereço: ${leadData.address}
- Tem website: ${leadData.website ? 'Sim' : 'Não'}
- Tem telefone: ${leadData.phone ? 'Sim' : 'Não'}

Critérios:
- 0-30: Desalinhado (nicho errado ou disqualifier presente)
- 31-60: Parcial (nicho correto mas fatores negativos)
- 61-85: Bom fit (nicho e perfil batem com ICP)
- 86-100: Lead perfeito (todos os must_have presentes)

Retorne APENAS JSON:
{
  "score": number,
  "tier": "A|B|C|D",
  "reasoning": "string curto em português",
  "fit_reasons": ["até 3 pontos positivos"],
  "concerns": ["até 2 pontos de atenção"],
  "priority": "high|medium|low"
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type === "text") {
    try {
      return parseClaudeJSON(content.text);
    } catch {
      return { score: 50, tier: "C", reasoning: "Falha na análise automática.", fit_reasons: [], concerns: [], priority: "medium" };
    }
  }
  return { score: 0, tier: "D", reasoning: "Erro na comunicação com IA.", fit_reasons: [], concerns: [], priority: "low" };
}

/**
 * 3.3 — Análise de resposta do lead com próximos passos.
 */
export async function analyzeLeadResponse(
  sentMessage: string,
  leadResponse: string,
  leadData: any,
  currentStage: string
) {
  const prompt = `Um lead respondeu à nossa mensagem de prospecção. Analise e defina o próximo passo.

MENSAGEM ENVIADA:
${sentMessage}

RESPOSTA DO LEAD:
${leadResponse}

CONTEXTO:
- Lead: ${leadData.name}
- Estágio atual: ${currentStage}
- Score: ${leadData.score}/100

Retorne APENAS JSON:
{
  "sentiment": "positive|neutral|negative|objection|interested|not_now",
  "intent": "resumo em uma linha do que o lead quer",
  "recommended_action": "schedule_call|send_info|follow_up|close|disqualify",
  "next_message": "sugestão de resposta para enviar",
  "move_to_stage": "contacted|interested|negotiating|closed|null",
  "urgency": "high|medium|low",
  "notes": "observações para o vendedor"
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0];
  if (content.type === "text") {
    return parseClaudeJSON(content.text);
  }
  throw new Error("Falha ao analisar resposta.");
}

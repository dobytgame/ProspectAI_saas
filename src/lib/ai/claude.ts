import OpenAI from "openai";

// Mantivemos o nome do arquivo (claude.ts) para não quebrar os imports, 
// mas agora o motor por trás de tudo é a OpenAI (gpt-4o).
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper para extrair JSON limpo do response
function parseJSON(text: string): any {
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

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  });

  const content = response.choices[0].message.content;
  if (content) {
    try {
      return parseJSON(content);
    } catch (e) {
      console.error("Failed to parse OpenAI response:", content);
      throw new Error("Falha ao processar perfil do negócio com IA.");
    }
  }
  
  throw new Error("Resposta inesperada da IA.");
}

/**
 * GERAÇÃO DE MENSAGEM — Versão 2.0
 * Usa persona de vendas, ângulo recomendado pelo scoring e tom calibrado.
 * Cada mensagem é única, específica e soa como escrita por um humano expert.
 */
export async function generateOutreachMessage(
  lead: any, business: any, campaign: any, agentConfig?: any
) {
  const isWhatsApp = campaign.channel === 'whatsapp';
  const persona = agentConfig?.sales_persona || {};
  const angles = agentConfig?.approach_angles || [];
  const recommendedAngle = lead.metadata?.recommended_angle || angles[0] || '';
  const objections = agentConfig?.objection_handling || {};
  const neverSay = persona.never_say || [];

  const systemPrompt = `Você é ${persona.name || business.name}, ${persona.role || 'Consultor de Vendas'}.
Sua personalidade: ${persona.personality || business.tone}.
Você representa: ${business.name} — ${business.segment}.

REGRAS DE OURO da sua comunicação:
${neverSay.map((s: string, i: number) => `${i+1}. NUNCA diga: "${s}"`).join('\n')}
- NUNCA mencione automação, robô ou IA
- NUNCA use linguagem corporativa genérica
- SEMPRE soe como uma pessoa real que pesquisou o lead
- SEMPRE foque no resultado para o lead, não nas features do produto`;

  const userPrompt = `Escreva UMA mensagem de primeiro contato para o lead abaixo.

CONTEXTO DA CAMPANHA:
Canal: ${campaign.channel.toUpperCase()}
Objetivo: ${campaign.name} — ${campaign.description}

DADOS DO LEAD (use para personalizar):
- Empresa: ${lead.name}
- Endereço: ${lead.address}
- Avaliação Google: ${lead.metadata?.rating || 'N/A'} estrelas (${lead.metadata?.user_ratings_total || 0} avaliações)
- Score de qualificação: ${lead.score}/100 (${lead.metadata?.tier || 'B'})
- Por que é um bom fit: ${lead.metadata?.reasoning || ''}
- Pontos fortes do lead: ${JSON.stringify(lead.metadata?.fit_reasons || [])}
${lead.phone ? `- Telefone: ${lead.phone}` : ''}
${lead.website ? `- Website: ${lead.website}` : ''}

ÂNGULO DE ABORDAGEM RECOMENDADO:
${recommendedAngle || 'Use o ângulo mais relevante para o perfil do lead'}

PROPOSTA DE VALOR DO PRODUTO:
${business.icp?.solution_value || ''}

${isWhatsApp ? `FORMATO WHATSAPP:
- Máximo 3 parágrafos CURTOS (cada um com no máximo 2 linhas)
- Tom conversacional, direto, sem formalidades excessivas
- Sem formatação markdown (sem **, sem -, sem listas)
- Terminar com UMA pergunta aberta simples
- Assinatura: ${persona.name || business.name}` : `FORMATO EMAIL:
- Primeira linha: ASSUNTO: [assunto que gera curiosidade, máximo 50 chars]
- 3-4 parágrafos bem estruturados
- Abertura que não começa com "Olá" ou "Oi"
- Parágrafo de valor claro com dado ou resultado específico
- CTA claro e fácil de responder
- Assinatura: ${persona.name || business.name} | ${business.name}`}

IMPORTANTE: A primeira frase DEVE mencionar algo específico sobre o ${lead.name} ou sua localização.
Escreva APENAS a mensagem. Sem explicações, sem comentários, sem notas.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
  });

  const content = response.choices[0].message.content;
  if (content) return content;
  throw new Error("Falha ao gerar mensagem.");
}

// ────────────────────────────────────────────
// Sprint 3: Prompts avançados & qualidade
// ────────────────────────────────────────────

/**
 * TREINAMENTO DO AGENTE — Versão 2.0
 * Cria um "DNA de vendas" completo: persona, ICP detalhado,
 * gatilhos de compra, objeções, proposta de valor e scripts de abordagem.
 */
export async function trainAgent(businessData: {
  name: string; description: string; services: string;
  targetAudience: string; differentials: string;
  tone: string; extraContext?: string;
}) {
  const systemPrompt = `Você é um Diretor de Vendas sênior com 15 anos de experiência em B2B brasileiro.
Sua especialidade é construir playbooks de vendas que geram resultados reais.
Você pensa como um vendedor que precisa bater meta — não como um consultor teórico.
Sua análise deve ser PRÁTICA, ESPECÍFICA e ACIONÁVEL.`;

  const userPrompt = `Analise profundamente o negócio abaixo e crie o DNA de vendas completo do agente de prospecção.

═══ DADOS DO NEGÓCIO ═══
Empresa: ${businessData.name}
Descrição: ${businessData.description}
Serviços/Produtos: ${businessData.services}
Público-alvo declarado: ${businessData.targetAudience}
Diferenciais: ${businessData.differentials}
Tom de comunicação: ${businessData.tone}
${businessData.extraContext ? `Contexto adicional (website/doc):\n${businessData.extraContext}` : ''}

═══ SUA MISSÃO ═══
Crie um agente de prospecção que:
1. Conhece profundamente QUEM compra e POR QUÊ compra
2. Sabe identificar o momento certo de abordar
3. Personaliza a mensagem por perfil de lead
4. Antecipa e responde objeções antes de serem levantadas
5. Tem uma identidade de comunicação forte e consistente

Retorne EXCLUSIVAMENTE JSON válido (sem markdown, sem comentários):
{
  "icp": {
    "target_audience": "descrição precisa de quem é o cliente ideal (cargo, porte, setor)",
    "pain_points": ["dor 1 específica do nicho", "dor 2", "dor 3", "dor 4", "dor 5"],
    "solution_value": "o que o cliente GANHA de concreto (resultado mensurável quando possível)",
    "ideal_segments": ["segmento A com exemplo real", "segmento B", "segmento C"],
    "buying_triggers": ["situação que faz o cliente buscar solução agora", "gatilho 2", "gatilho 3"],
    "disqualifiers": ["sinal claro de que não é cliente ideal", "disqualifier 2"]
  },
  "sales_persona": {
    "name": "nome do agente (ex: Agente ${businessData.name})",
    "role": "cargo que o agente representa (ex: Consultor de Crescimento)",
    "personality": "3 traços de personalidade que definem o estilo (ex: direto, consultivo, focado em ROI)",
    "never_say": ["frase que nunca deve aparecer nas mensagens", "frase 2", "frase 3"],
    "always_do": ["comportamento obrigatório na abordagem", "comportamento 2"]
  },
  "objection_handling": {
    "nao_tenho_tempo": "resposta curta e direta para 'não tenho tempo'",
    "ja_tenho_fornecedor": "resposta para 'já tenho quem faz isso'",
    "muito_caro": "resposta para objeção de preço sem dar desconto",
    "nao_preciso": "resposta para 'não preciso disso agora'"
  },
  "approach_angles": [
    "ângulo 1: baseado na dor mais comum (ex: 'vi que vocês...')",
    "ângulo 2: baseado em resultado/prova social do nicho",
    "ângulo 3: baseado em timing/oportunidade do mercado",
    "ângulo 4: baseado em curiosidade/dado surpreendente",
    "ângulo 5: baseado em conexão geográfica ou setorial"
  ],
  "scoring_criteria": {
    "must_have": ["critério eliminatório positivo 1", "critério 2", "critério 3"],
    "nice_to_have": ["bônus de qualificação 1", "bônus 2"],
    "red_flags": ["sinal de desqualificação 1", "sinal 2", "sinal 3"]
  },
  "suggested_tone": "tom de voz detalhado (ex: 'Direto e consultivo — como um amigo especialista, não como vendedor')",
  "niche": "nome do nicho em 2-4 palavras"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    response_format: { type: "json_object" }
  });

  const content = response.choices[0].message.content;
  if (content) {
    return parseJSON(content);
  }
  throw new Error("Falha ao treinar agente.");
}

/**
 * 3.1.5 — Análise individual de Fonte de Conhecimento (URL/PDF)
 * Extrai dados isolados de uma única fonte para salvar no histórico.
 */
export async function analyzeKnowledgeSource(sourceText: string, businessName: string, sourceType: string) {
  const cleanText = sourceText.trim();
  
  if (cleanText.length < 50) {
    return {
      insight: "Conteúdo insuficiente para uma análise profunda nesta fonte. Tente uma URL com mais conteúdo textual ou um documento completo.",
      confidence: 10
    };
  }

  const snippet = cleanText.substring(0, 20000);
  const isPdf = sourceType === "pdf";

  const prompt = `Analise o conteúdo desta fonte (${sourceType}) relacionada à empresa "${businessName}".

Sua tarefa é extrair inteligência de vendas com base APENAS no texto entre os delimitadores <<< e >>> abaixo:
1. O que a empresa faz? (proposta de valor)
2. Para quem vende? (público / nicho)
3. Que problemas resolve? (dores do cliente)
4. Diferenciais competitivos?

Regras:
- Use fatos e frases presentes no texto; não invente serviços ou clientes que não apareçam.
${isPdf ? "- Se o texto for claramente só cabeçalhos, numeração de página ou lixo de extração, diga isso e peça PDF com camada de texto ou documento editável.\n" : ""}
- Seja específico e acionável para um agente de prospecção.

<<<INÍCIO DO TEXTO EXTRAÍDO>>>
${snippet}
<<<FIM DO TEXTO EXTRAÍDO>>>

Retorne EXCLUSIVAMENTE um JSON no formato:
{
  "insight": "Um resumo detalhado e persuasivo do que foi aprendido (3-5 parágrafos).",
  "confidence": number (0-100)
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  });

  const content = response.choices[0].message.content;
  if (content) {
    try {
      return parseJSON(content);
    } catch {
      return { insight: "Falha ao processar insight detalhado.", confidence: 50 };
    }
  }
  throw new Error("Falha ao analisar fonte de conhecimento.");
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

Retorne APENAS JSON no seguinte formato:
{
  "score": number,
  "tier": "A|B|C|D",
  "reasoning": "string curto em português",
  "fit_reasons": ["até 3 pontos positivos"],
  "concerns": ["até 2 pontos de atenção"],
  "priority": "high|medium|low"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  });

  const content = response.choices[0].message.content;
  if (content) {
    try {
      return parseJSON(content);
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

Retorne APENAS JSON no formato:
{
  "sentiment": "positive|neutral|negative|objection|interested|not_now",
  "intent": "resumo em uma linha do que o lead quer",
  "recommended_action": "schedule_call|send_info|follow_up|close|disqualify",
  "next_message": "sugestão de resposta para enviar",
  "move_to_stage": "contacted|interested|negotiating|closed|null",
  "urgency": "high|medium|low",
  "notes": "observações para o vendedor"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  });

  const content = response.choices[0].message.content;
  if (content) {
    return parseJSON(content);
  }
  throw new Error("Falha ao analisar resposta.");
}

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function extractBusinessProfile(description: string) {
  const prompt = `
    Analise os dados do negócio abaixo e extraia o ICP (Perfil de Cliente Ideal) e o Tom de Voz sugerido para as mensagens de prospecção.
    
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
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Você é um especialista em marketing e vendas B2B. Responda apenas com JSON válido." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  });

  const text = response.choices[0].message.content || "{}";
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse OpenAI response:", text);
    throw new Error("Falha ao processar perfil do negócio com OpenAI.");
  }
}

export async function scoreLead(leadData: any, businessICP: any) {
  const prompt = `
    Avalie o seguinte lead (empresa) com base no Perfil de Cliente Ideal (ICP) do meu negócio.
    
    MEU ICP: ${typeof businessICP === 'string' ? businessICP : JSON.stringify(businessICP)}
    
    LEAD ENCONTRADO:
    Nome: ${leadData.name}
    Endereço: ${leadData.address}
    Rating: ${leadData.metadata?.rating || 'N/A'}
    
    Retorne APENAS um JSON no formato:
    {
      "score": number (0 a 100),
      "reasoning": "string (curto e direto em português)"
    }
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Analista de leads B2B. Responda apenas com JSON." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  });

  const text = response.choices[0].message.content || "{}";

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse Lead Score (OpenAI):", text);
    return { score: 50, reasoning: "Falha na análise automática." };
  }
}

export async function generateOutreachMessage(lead: any, business: any, campaign: any) {
  const prompt = `
    Crie uma primeira mensagem de abordagem personalizada para o lead abaixo.
    
    Empresa (Minha): ${JSON.stringify(business)}
    Lead (Destinatário): ${JSON.stringify(lead)}
    Canal: ${campaign.channel}
    Campanha: ${campaign.name} - ${campaign.description}

    Diretrizes:
    - Seja breve e direto.
    - Foque na dor/necessidade do lead.
    - Se for WhatsApp, use um tom amigável.
    - Se for Email, inclua um Assunto.
    
    Retorne apenas o texto final em Português.
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }]
  });

  return response.choices[0].message.content || "";
}

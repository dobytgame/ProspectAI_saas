import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function extractBusinessProfile(description: string) {
  const prompt = `
    Analise os dados do negócio abaixo e extraia o ICP (Perfil de Cliente Ideal) e o Tom de Voz sugerido para as mensagens de prospecção.
    Estes dados podem incluir uma descrição direta, conteúdo de um website ou texto de um documento.
    
    DADOS DO NEGÓCIO:
    "${description}"
    
    Retorne APENAS um JSON no seguinte formato (sem markdown blocks):
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

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  // Clean potential markdown blocks
  const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
  
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse Gemini response:", text);
    throw new Error("Falha ao processar perfil do negócio com Gemini.");
  }
}

export async function scoreLead(leadData: any, businessICP: any) {
  const prompt = `
    Avalie o seguinte lead (empresa) com base no Perfil de Cliente Ideal (ICP) do meu negócio e atribua uma nota de 0 a 100 de quão qualificado ele é para uma abordagem comercial.
    
    MEU ICP: ${JSON.stringify(businessICP)}
    
    LEAD ENCONTRADO:
    Nome: ${leadData.name}
    Categoria: ${JSON.stringify(leadData.metadata?.types || [])}
    Avaliação no Maps: ${leadData.metadata?.rating || 'N/A'}
    Endereço: ${leadData.address}
    
    Critérios:
    - 0-30: Desalinhado total (outro nicho, local irrelevante).
    - 31-60: Alinhamento parcial (nicho correto mas outros fatores negativos).
    - 61-90: Bom alinhamento (nicho e perfil batem com o ICP).
    - 91-100: Lead perfeito (exatamente o que o negócio procura).
    
    Retorne APENAS um JSON no formato:
    {
      "score": number,
      "reasoning": "string (curto e direto em português)"
    }
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse Lead Score (Gemini):", text);
    return { score: 50, reasoning: "Falha na análise automática." };
  }
}

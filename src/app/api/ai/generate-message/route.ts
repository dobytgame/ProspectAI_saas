import { NextResponse } from 'next/server'
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { createClient } from "@/utils/supabase/server";
import { getSystemPrompt } from "@/lib/ai/prompts";

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { leadId } = await req.json()
    const supabase = await createClient()

    // 1. Get Lead and Business details
    const { data: lead } = await supabase
      .from("leads")
      .select("*, business:businesses(*, agents(config))")
      .eq("id", leadId)
      .single()

    if (!lead) return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 })

    const business = lead.business
    const plan = business.plan || 'free'
    const systemPrompt = getSystemPrompt(plan, business, lead)

    let generatedMessage = ""

    // 2. Routing based on Plan
    if (plan === 'starter') {
      // Use OpenAI GPT-4o
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Crie uma mensagem para abordar o lead ${lead.name}.` }
        ],
        temperature: 0.7,
      });
      generatedMessage = response.choices[0].message.content || ""
    } else if (plan === 'pro' || plan === 'scale') {
      // Use Claude 3.5 Sonnet (Premium)
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: `Gere a melhor abordagem possível para o lead ${lead.name}.` }],
      });
      const content = response.content[0];
      generatedMessage = content.type === "text" ? content.text : ""
    } else {
      // Free: Basic approach using a cheaper model or same Sonnet with restricted prompt
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: "user", content: `Escreva uma saudação para o lead ${lead.name}.` }],
      });
      const content = response.content[0];
      generatedMessage = content.type === "text" ? content.text : ""
    }

    return NextResponse.json({ 
      message: generatedMessage,
      planUsed: plan
    })
  } catch (error) {
    console.error("Generate message error:", error)
    return NextResponse.json({ error: "Erro ao gerar mensagem." }, { status: 500 })
  }
}

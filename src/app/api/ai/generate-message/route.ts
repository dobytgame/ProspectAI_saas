import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getSystemPrompt } from "@/lib/ai/prompts";
import {
  openai,
  OPENAI_MODEL_FLAGSHIP,
  OPENAI_MODEL_FAST,
} from "@/lib/ai/openai-client";

export async function POST(req: Request) {
  try {
    const { leadId } = await req.json();
    const supabase = await createClient();

    const { data: lead } = await supabase
      .from("leads")
      .select("*, business:businesses(*, agents(config))")
      .eq("id", leadId)
      .single();

    if (!lead)
      return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });

    const business = lead.business;
    const plan = business.plan || "free";
    const systemPrompt = getSystemPrompt(plan, business, lead);

    const model = plan === "free" ? OPENAI_MODEL_FAST : OPENAI_MODEL_FLAGSHIP;
    const maxTokens = plan === "free" ? 500 : plan === "starter" ? 800 : 1000;

    const userContent =
      plan === "free"
        ? `Escreva uma saudação para o lead ${lead.name}.`
        : plan === "starter"
          ? `Crie uma mensagem para abordar o lead ${lead.name}.`
          : `Gere a melhor abordagem possível para o lead ${lead.name}.`;

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    });

    const generatedMessage = response.choices[0]?.message?.content || "";

    return NextResponse.json({
      message: generatedMessage,
      planUsed: plan,
    });
  } catch (error) {
    console.error("Generate message error:", error);
    return NextResponse.json(
      { error: "Erro ao gerar mensagem." },
      { status: 500 }
    );
  }
}

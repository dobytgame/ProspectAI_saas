import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { trainAgent } from "@/lib/ai/claude";
import { mergeOnboardingKbSkippedMetadata } from "@/lib/business/metadata-flags";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const businessId = body.business_id;
    const skippedEmptyKb = body.skipped_empty_kb === true;

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    // 1. Fetch Business
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .eq("user_id", user.id)
      .single();

    if (businessError || !business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // 2. Fetch all completed Knowledge Bases
    const { data: knowledgeItems, error: kbError } = await supabase
      .from("knowledge_bases")
      .select("ai_feedback, source, type")
      .eq("business_id", businessId)
      .eq("status", "completed");

    if (kbError) throw kbError;

    const completedKbCount = knowledgeItems?.length ?? 0;

    // 3. Concatenate Feedback
    let extraContext = "";
    if (knowledgeItems && knowledgeItems.length > 0) {
      extraContext = "Abaixo está o aprendizado consolidado de várias fontes da empresa coletadas previamente:\n\n";
      knowledgeItems.forEach((kb, index) => {
        extraContext += `FONTE ${index + 1} (${kb.type} - ${kb.source}):\n"${kb.ai_feedback}"\n\n`;
      });
    }

    // 4. Call Claude to synthesize everything
    const aiProfile = await trainAgent({
      name: business.name,
      description: business.icp?.description || "", // Keep existing if any
      services: "", // We rely on the knowledge bases now
      targetAudience: "",
      differentials: "",
      tone: business.tone || "Profissional",
      extraContext: extraContext,
    });

    // 5. Update Business ICP + metadata (banner "IA básica" no dashboard)
    const metadata = mergeOnboardingKbSkippedMetadata(
      business.metadata,
      completedKbCount,
      skippedEmptyKb
    );

    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        segment: aiProfile.niche,
        icp: aiProfile.icp,
        tone: aiProfile.suggested_tone,
        metadata,
      })
      .eq("id", business.id);

    if (updateError) throw updateError;

    // 6. Update Agent Config
    const agentConfig: any = {
      base_prompt: `Você é um assessor comercial da ${business.name}. Seu objetivo é prospectar clientes do nicho ${aiProfile.niche}.`,
      tone: aiProfile.suggested_tone,
      scoring_criteria: aiProfile.scoring_criteria,
      approach_angles: aiProfile.approach_angles,
      sales_persona: aiProfile.sales_persona,
      objection_handling: aiProfile.objection_handling
    };

    const { data: existingAgent } = await supabase
      .from("agents")
      .select("id")
      .eq("business_id", business.id)
      .single();

    if (existingAgent) {
      await supabase
        .from("agents")
        .update({ config: agentConfig })
        .eq("id", existingAgent.id);
    } else {
      await supabase
        .from("agents")
        .insert({
          business_id: business.id,
          config: agentConfig,
        });
    }

    return NextResponse.json({ success: true, aiProfile });

  } catch (error: any) {
    console.error("Synthesize Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

'use server'

import { createClient } from "@/utils/supabase/server";
import { extractBusinessProfile, trainAgent } from "@/lib/ai/claude";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import axios from "axios";

export async function onboardBusiness(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const services = formData.get("services") as string;
  const targetAudience = formData.get("target_audience") as string;
  const differentials = formData.get("differentials") as string;
  const tone = formData.get("tone") as string || "Profissional";
  const websiteUrl = formData.get("website_url") as string;
  const file = formData.get("file") as File;
  const plan = formData.get("plan") as string || "free";

  let extraContext = "";

  try {
    // 1. Extract from Website if provided
    if (websiteUrl) {
      try {
        const response = await axios.get(websiteUrl, { timeout: 5000 });
        const html = response.data;
        const text = html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').substring(0, 5000);
        extraContext += `\nCONTEÚDO DO WEBSITE:\n${text}\n`;
      } catch (err) {
        console.error("Website fetch error:", err);
      }
    }

    // 2. Extract from File if provided
    if (file && file.size > 0) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        if (file.type === "application/pdf") {
          const pdfParse = require("pdf-parse");
          const result = await pdfParse(buffer);
          extraContext += `\nCONTEÚDO DO DOCUMENTO (PDF):\n${result.text}\n`;
        } else {
          const text = buffer.toString("utf-8");
          extraContext += `\nCONTEÚDO DO DOCUMENTO (TXT):\n${text}\n`;
        }
      } catch (err) {
        console.error("File parse error:", err);
      }
    }

    // 3. Train agent with structured data (Sprint 3) or fallback to basic extraction
    let aiProfile;

    if (services || targetAudience || differentials) {
      // Sprint 3: trainAgent com dados estruturados
      aiProfile = await trainAgent({
        name,
        description: description || "",
        services: services || "",
        targetAudience: targetAudience || "",
        differentials: differentials || "",
        tone,
        extraContext: extraContext || undefined,
      });
    } else {
      // Fallback: extractBusinessProfile com prompt simples
      const fullPrompt = `${description}\n${extraContext}`;
      aiProfile = await extractBusinessProfile(fullPrompt);
    }

    // 4. Save business profile
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .upsert({
        user_id: user.id,
        name,
        segment: aiProfile.niche,
        icp: aiProfile.icp,
        tone: aiProfile.suggested_tone,
        website: websiteUrl || null,
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (businessError) throw businessError;

    // 5. Create/Update Agent for this business
    const agentConfig: any = {
      base_prompt: `Você é um assessor comercial da ${name}. Seu objetivo é prospectar clientes do nicho ${aiProfile.niche}.`,
      tone: aiProfile.suggested_tone,
    };

    // Incluir scoring_criteria e approach_angles se disponíveis (Sprint 3)
    if (aiProfile.scoring_criteria) {
      agentConfig.scoring_criteria = aiProfile.scoring_criteria;
    }
    if (aiProfile.approach_angles) {
      agentConfig.approach_angles = aiProfile.approach_angles;
    }

    // Upsert por business_id para evitar duplicatas
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
      const { error: agentError } = await supabase
        .from("agents")
        .insert({
          business_id: business.id,
          config: agentConfig,
        });
      if (agentError) throw agentError;
    }

    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Onboarding error:", error);
    redirect("/onboarding?error=true");
  }

  if (plan === 'pro') {
    redirect("/upgrade");
  }

  redirect("/dashboard");
}

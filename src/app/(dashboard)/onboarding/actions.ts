'use server'

import { createClient } from "@/utils/supabase/server";
import { extractBusinessProfile } from "@/lib/ai/openai";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import axios from "axios";
import { PDFParse } from "pdf-parse";

export async function onboardBusiness(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const websiteUrl = formData.get("website_url") as string;
  const file = formData.get("file") as File;

  let extraContext = "";

  try {
    // 1. Extract from Website if provided
    if (websiteUrl) {
      try {
        const response = await axios.get(websiteUrl, { timeout: 5000 });
        const html = response.data;
        // Simple extraction: remove tags
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
          const parser = new PDFParse({ data: buffer });
          const result = await parser.getText();
          extraContext += `\nCONTEÚDO DO DOCUMENTO (PDF):\n${result.text}\n`;
        } else {
          const text = buffer.toString("utf-8");
          extraContext += `\nCONTEÚDO DO DOCUMENTO (TXT):\n${text}\n`;
        }
      } catch (err) {
        console.error("File parse error:", err);
      }
    }

    // 3. Extract profile with Claude incorporating all context
    const fullPrompt = `${description}\n${extraContext}`;
    const aiProfile = await extractBusinessProfile(fullPrompt);

    // 2. Save business profile
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .upsert({
        user_id: user.id,
        name,
        segment: aiProfile.niche,
        icp: aiProfile.icp,
        tone: aiProfile.suggested_tone,
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (businessError) throw businessError;

    // 3. Create initial Agent for this business
    const { error: agentError } = await supabase
      .from("agents")
      .insert({
        business_id: business.id,
        config: {
          base_prompt: `Você é um assessor comercial da ${name}. Seu objetivo é prospectar clientes do nicho ${aiProfile.niche}.`,
          tone: aiProfile.suggested_tone,
        }
      });

    if (agentError) throw agentError;

    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Onboarding error:", error);
    redirect("/onboarding?error=true");
  }

  redirect("/dashboard");
}

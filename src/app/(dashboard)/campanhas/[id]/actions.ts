'use server'

import { createClient } from "@/utils/supabase/server";
import { generateOutreachMessage } from "@/lib/ai/openai";
import { revalidatePath } from "next/cache";

export async function generateAllAction(campaignId: string) {
  const supabase = await createClient();
  
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*, business:businesses(*)")
    .eq("id", campaignId)
    .single();

  if (!campaign) return;

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .eq("campaign_id", campaignId);

  if (!leads) return;

  for (const lead of leads) {
    if (lead.metadata?.generated_message) continue;
    const message = await generateOutreachMessage(lead, campaign.business, campaign);
    await supabase
      .from("leads")
      .update({ 
        metadata: { ...lead.metadata, generated_message: message },
        status: 'ready' 
      })
      .eq("id", lead.id);
  }
  revalidatePath(`/campanhas/${campaignId}`);
}

export async function generateMessageAction(leadId: string, campaignId: string) {
  const supabase = await createClient();
  
  const { data: lead } = await supabase.from("leads").select("*").eq("id", leadId).single();
  if (!lead) return;

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*, business:businesses(*)")
    .eq("id", campaignId)
    .single();

  if (!campaign) return;

  const message = await generateOutreachMessage(lead, campaign.business, campaign);
  await supabase
    .from("leads")
    .update({ 
      metadata: { ...lead.metadata, generated_message: message },
      status: 'ready'
    })
    .eq("id", leadId);
  
  revalidatePath(`/campanhas/${campaignId}`);
}

export async function markAsContactedAction(leadId: string, campaignId: string) {
  const supabase = await createClient();
  await supabase.from("leads").update({ status: 'contacted' }).eq("id", leadId);
  revalidatePath(`/campanhas/${campaignId}`);
}

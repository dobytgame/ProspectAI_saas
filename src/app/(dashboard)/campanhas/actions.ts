'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCampaignAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) throw new Error("Negócio não encontrado");

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const channel = formData.get('channel') as string;

  const { error } = await supabase
    .from("campaigns")
    .insert({
      business_id: business.id,
      name,
      description,
      channel,
      status: 'active'
    });

  if (error) throw error;

  revalidatePath("/campanhas");
}

export async function deleteCampaignAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/campanhas");
}

export async function assignLeadToCampaignAction(leadId: string, campaignId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ campaign_id: campaignId, status: 'contacted' })
    .eq("id", leadId);
  
  if (error) throw error;
  revalidatePath("/dashboard");
  revalidatePath("/pipeline");
}

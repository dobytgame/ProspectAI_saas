'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCampaignAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, plan")
    .eq("user_id", user.id)
    .single();

  if (!business) throw new Error("Negócio não encontrado");

  if (business.plan === 'free') {
    const { count } = await supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('business_id', business.id);
    if ((count || 0) >= 3) {
      return { error: "LIMIT_REACHED_CAMPAIGNS" };
    }
  }

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

  if (error) return { error: error.message };

  revalidatePath("/campanhas");
  return { success: true };
}

export async function deleteCampaignAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/campanhas");
}

export async function renameCampaignAction(id: string, name: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("campaigns")
    .update({ name })
    .eq("id", id);
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

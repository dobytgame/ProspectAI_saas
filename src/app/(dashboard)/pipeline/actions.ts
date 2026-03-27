'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { PlanType, PLAN_LIMITS } from "@/utils/plan-limits";

export async function updateLeadStatus(leadId: string, newStatus: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado");

  const { data: lead } = await supabase
    .from("leads")
    .update({ status: newStatus })
    .eq("id", leadId)
    .select("business_id")
    .single();

  if (newStatus === 'closed' && lead?.business_id) {
    const { updateLearnedICP } = await import("@/lib/ai/dynamic-icp");
    // Run in background or wait, depending on preference. For now, we'll fire and forget or await.
    updateLearnedICP(lead.business_id);
  }
  
  revalidatePath("/pipeline");
}

export async function saveLeadNote(leadId: string, note: string) {
  const supabase = await createClient()
  const { data: lead } = await supabase.from('leads').select('metadata').eq('id', leadId).single()
  
  if (!lead) return
  
  const metadata = lead.metadata || {}
  const notes = metadata.notes || []
  notes.push({ text: note, date: new Date().toISOString() })
  
  await supabase.from('leads')
    .update({ metadata: { ...metadata, notes } })
    .eq('id', leadId)
    
  revalidatePath('/pipeline')
}

export async function toggleLeadTag(leadId: string, tag: string) {
  const supabase = await createClient()
  const { data: lead } = await supabase.from('leads').select('metadata').eq('id', leadId).single()
  
  if (!lead) return
  
  const metadata = lead.metadata || {}
  let tags = metadata.tags || []
  
  if (tags.includes(tag)) {
    tags = tags.filter((t: string) => t !== tag)
  } else {
    tags.push(tag)
  }
  
  await supabase.from('leads')
    .update({ metadata: { ...metadata, tags } })
    .eq('id', leadId)
    
  revalidatePath('/pipeline')
}

export async function logContact(leadId: string, type: 'whatsapp' | 'email' | 'call') {
  const supabase = await createClient()
  const { data: lead } = await supabase.from('leads').select('metadata').eq('id', leadId).single()
  
  if (!lead) return
  
  const metadata = lead.metadata || {}
  const history = metadata.contact_history || []
  history.push({ type, date: new Date().toISOString() })
  
  await supabase.from('leads')
    .update({ 
      status: 'contacted',
      metadata: { ...metadata, contact_history: history, last_contact: new Date().toISOString() } 
    })
    .eq('id', leadId)
    
  revalidatePath('/pipeline')
}

export async function generatePipelineMessage(leadId: string, campaignId: string) {
  const { generateMessageAction } = await import('@/app/(dashboard)/campanhas/[id]/actions');
  await generateMessageAction(leadId, campaignId);
  revalidatePath('/pipeline');
}

export async function importLeads(leads: any[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, plan, leads_used_this_month")
    .eq("user_id", user.id)
    .single();

  if (!business) throw new Error("Negócio não encontrado");

  // 1. Check Feature Access
  const plan = (business.plan || 'free') as PlanType;
  if (!PLAN_LIMITS[plan].features.includes('can_import_csv')) {
    throw new Error("Seu plano não permite importação de CSV. Faça o upgrade para o PRO.");
  }

  // 2. Check Lead Limits
  const currentLeadsCount = business.leads_used_this_month || 0;
  const limit = PLAN_LIMITS[plan].leadsPerMonth;

  if (currentLeadsCount + leads.length > limit) {
    throw new Error(`A importação de ${leads.length} leads excederia seu limite mensal de ${limit} leads.`);
  }

  const leadsToInsert = leads.map(l => ({
    ...l,
    business_id: business.id,
    status: 'new',
    metadata: { 
      ...(l.metadata || {}),
      source: 'csv_import',
      imported_at: new Date().toISOString()
    }
  }));

  const { error } = await supabase
    .from("leads")
    .insert(leadsToInsert);

  if (error) throw error;

  // 3. Increment Counter
  await supabase.rpc('increment_business_leads', { 
    p_business_id: business.id, 
    p_count: leadsToInsert.length 
  });
  
  revalidatePath("/pipeline");
}

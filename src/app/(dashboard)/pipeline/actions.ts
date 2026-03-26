'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateLeadStatus(leadId: string, newStatus: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado");

  const { error } = await supabase
    .from("leads")
    .update({ status: newStatus })
    .eq("id", leadId);

  if (error) throw error;
  
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

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

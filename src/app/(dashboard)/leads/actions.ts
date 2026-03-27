'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getLeadsAction(filters: { city?: string; segment?: string }, page: number = 1, pageSize: number = 10) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) throw new Error("Perfil de negócio não encontrado");

  let query = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  if (filters.city) {
    query = query.ilike("address", `%${filters.city}%`);
  }

  if (filters.segment) {
    query = query.ilike("segment", `%${filters.segment}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: leads, count, error } = await query.range(from, to);

  if (error) throw error;

  return {
    leads: leads || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function deleteLeadsAction(leadIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) throw new Error("Perfil de negócio não encontrado");

  const { error } = await supabase
    .from("leads")
    .delete()
    .in("id", leadIds)
    .eq("business_id", business.id);

  if (error) throw error;

  revalidatePath("/leads");
  return { success: true };
}

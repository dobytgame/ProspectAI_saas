'use server'

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function createBusinessCore(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = formData.get("name") as string;
  const tone = formData.get("tone") as string || "Profissional";

  if (!name) {
    throw new Error("Nome é obrigatório");
  }

  try {
    const { data: business, error } = await supabase
      .from("businesses")
      .upsert({
        user_id: user.id,
        name,
        tone,
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    
    return { success: true, businessId: business.id };
  } catch (error: any) {
    console.error("Onboarding step 1 error:", error);
    return { error: error.message };
  }
}

export async function finalizeOnboarding(plan: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (plan === 'pro') {
    redirect("/upgrade");
  }
  redirect("/dashboard");
}


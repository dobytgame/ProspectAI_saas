'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateBusinessAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autorizado");

  const name = formData.get("name") as string;
  const segment = formData.get("segment") as string;
  const website = formData.get("website") as string;
  const icp = formData.get("icp") as string;

  const { error } = await supabase
    .from("businesses")
    .update({ name, segment, website, icp })
    .eq("user_id", user.id);

  if (error) throw error;

  revalidatePath("/settings");
}

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient();
  
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;

  const { error } = await supabase.auth.updateUser({
    data: { full_name: `${firstName} ${lastName}` }
  });

  if (error) throw error;

  revalidatePath("/settings");
}

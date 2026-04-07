"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

function asRecord(meta: unknown): Record<string, unknown> {
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    return { ...(meta as Record<string, unknown>) };
  }
  return {};
}

export async function setGettingStartedGuideDismissed(dismissed: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false as const, message: "Não autorizado." };

  const { data: row, error: fetchErr } = await supabase
    .from("businesses")
    .select("metadata")
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !row) {
    return { ok: false as const, message: "Negócio não encontrado." };
  }

  const metadata = { ...asRecord(row.metadata), getting_started_guide_dismissed: dismissed };

  const { error } = await supabase.from("businesses").update({ metadata }).eq("user_id", user.id);

  if (error) {
    return { ok: false as const, message: error.message };
  }

  revalidatePath("/dashboard");
  return { ok: true as const };
}

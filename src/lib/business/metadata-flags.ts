import type { SupabaseClient } from "@supabase/supabase-js";

function asRecord(meta: unknown): Record<string, unknown> {
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    return { ...(meta as Record<string, unknown>) };
  }
  return {};
}

/**
 * Atualiza flag para o banner do dashboard após síntese do onboarding.
 */
export function mergeOnboardingKbSkippedMetadata(
  prevMetadata: unknown,
  completedKbCount: number,
  skippedEmptyKb: boolean
): Record<string, unknown> {
  const m = asRecord(prevMetadata);
  if (completedKbCount > 0) {
    m.onboarding_kb_skipped = false;
  } else if (skippedEmptyKb) {
    m.onboarding_kb_skipped = true;
  }
  return m;
}

/** Após adicionar URL, PDF ou texto manual à base de conhecimento. */
export async function clearOnboardingKbSkippedFlag(
  supabase: SupabaseClient,
  businessId: string
) {
  const { data: row } = await supabase
    .from("businesses")
    .select("metadata")
    .eq("id", businessId)
    .single();

  const metadata = { ...asRecord(row?.metadata), onboarding_kb_skipped: false };
  await supabase.from("businesses").update({ metadata }).eq("id", businessId);
}

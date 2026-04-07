import type { SupabaseClient } from "@supabase/supabase-js";

export type GettingStartedProgress = {
  knowledge: boolean;
  campaign: boolean;
  prospects: boolean;
  messages: boolean;
  allComplete: boolean;
  /** Usuário clicou em ocultar guia (enquanto ainda há passos pendentes). */
  dismissed: boolean;
  percent: number;
  /** Para link direto “Abrir campanha” quando já existir. */
  firstCampaignId: string | null;
};

function isDismissed(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return false;
  return (metadata as Record<string, unknown>).getting_started_guide_dismissed === true;
}

/**
 * Progresso do mini tutorial: calculado a partir de dados reais (sem checklist manual).
 */
export async function getGettingStartedProgress(
  supabase: SupabaseClient,
  businessId: string,
  businessMetadata: unknown
): Promise<GettingStartedProgress> {
  const dismissed = isDismissed(businessMetadata);

  const [
    { count: kbCount },
    { count: kpCount },
    { count: campaignCount },
    { count: leadsCount },
    { data: leadsSample },
    { data: lastCampaign },
  ] = await Promise.all([
    supabase
      .from("knowledge_bases")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "completed"),
    supabase
      .from("knowledge_profiles")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "completed"),
    supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),
    supabase.from("leads").select("metadata").eq("business_id", businessId).limit(300),
    supabase
      .from("campaigns")
      .select("id")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const knowledge = (kbCount ?? 0) > 0 || (kpCount ?? 0) > 0;
  const campaign = (campaignCount ?? 0) > 0;
  const prospects = (leadsCount ?? 0) > 0;
  const messages = (leadsSample ?? []).some((row) => {
    const m = row.metadata as Record<string, unknown> | null | undefined;
    const gm = m?.generated_message;
    return typeof gm === "string" && gm.trim().length > 0;
  });

  const done = [knowledge, campaign, prospects, messages].filter(Boolean).length;
  const allComplete = done === 4;
  const percent = Math.round((done / 4) * 100);

  return {
    knowledge,
    campaign,
    prospects,
    messages,
    allComplete,
    dismissed,
    percent,
    firstCampaignId: lastCampaign?.id ?? null,
  };
}

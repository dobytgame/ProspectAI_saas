export type PlanType = 'free' | 'starter' | 'pro' | 'scale';

export interface PlanLimits {
  leadsPerMonth: number;
  maxCampaigns: number;
  maxAgents: number;
  /** Perfis de conhecimento para campanhas (-1 = ilimitado) */
  maxKnowledgeProfiles: number;
  /** Páginas de resultados do Google Places Text Search (20 leads/página aprox.) */
  maxPagesPerSearch: number;
  features: string[];
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    leadsPerMonth: 100,
    maxCampaigns: 1,
    maxAgents: 1,
    maxKnowledgeProfiles: 2,
    maxPagesPerSearch: 1,
    features: ['maps_view', 'email_support']
  },
  starter: {
    leadsPerMonth: 300,
    maxCampaigns: 3,
    maxAgents: 1,
    maxKnowledgeProfiles: 5,
    maxPagesPerSearch: 3,
    features: ['maps_view', 'email_support', 'gpt4_messages', 'can_export_csv', 'advanced_filters']
  },
  pro: {
    leadsPerMonth: 1000,
    maxCampaigns: 100, // Ilimitado na prática
    maxAgents: 3,
    maxKnowledgeProfiles: 10,
    maxPagesPerSearch: 3,
    features: ['maps_view', 'email_support', 'premium_messages', 'can_export_csv', 'can_import_csv', 'advanced_filters', 'crm_followup']
  },
  scale: {
    leadsPerMonth: 5000,
    maxCampaigns: 100, // Ilimitado na prática
    maxAgents: 5,
    maxKnowledgeProfiles: -1,
    maxPagesPerSearch: 5,
    features: ['maps_view', 'email_support', 'premium_messages', 'can_export_csv', 'can_import_csv', 'advanced_filters', 'crm_followup', 'dynamic_icp', 'ab_testing', 'enrichment', 'vip_support']
  }
};

export function checkLimit(currentCount: number, plan: PlanType, limitType: keyof Omit<PlanLimits, 'features'>): { allowed: boolean; limit: number } {
  const limit = PLAN_LIMITS[plan][limitType] as number;
  if (limit === -1) {
    return { allowed: true, limit: -1 };
  }
  return {
    allowed: currentCount < limit,
    limit
  };
}

export function knowledgeProfileLimitLabel(plan: PlanType): string {
  const n = PLAN_LIMITS[plan].maxKnowledgeProfiles;
  if (n === -1) return "Ilimitados";
  return String(n);
}

export function hasFeature(plan: PlanType, feature: string): boolean {
  return PLAN_LIMITS[plan].features.includes(feature);
}

/** Server actions return Portuguese codes like VOCE_ATINGIU_O_LIMITE_* */
export function isPlanLimitError(message: string | undefined | null): boolean {
  if (!message) return false;
  const u = message.toUpperCase();
  return (
    u.includes("LIMITE") ||
    u.includes("LIMIT_REACHED") ||
    u.includes("ATINGIU") ||
    u.includes("PERFIS_DE_CONHECIMENTO")
  );
}

export async function getPlanUsage(supabase: any, businessId: string, plan: PlanType) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: leadsUsed } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .gte('created_at', startOfMonth.toISOString());

  const limits = PLAN_LIMITS[plan];
  
  return {
    used: leadsUsed || 0,
    total: limits.leadsPerMonth,
    planName: plan.charAt(0).toUpperCase() + plan.slice(1)
  };
}

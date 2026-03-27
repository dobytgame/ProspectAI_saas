export type PlanType = 'free' | 'starter' | 'pro' | 'scale';

export interface PlanLimits {
  leadsPerMonth: number;
  maxCampaigns: number;
  maxAgents: number;
  features: string[];
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    leadsPerMonth: 100,
    maxCampaigns: 1,
    maxAgents: 1,
    features: ['maps_view', 'email_support']
  },
  starter: {
    leadsPerMonth: 300,
    maxCampaigns: 3,
    maxAgents: 1,
    features: ['maps_view', 'email_support', 'gpt4_messages', 'can_export_csv', 'advanced_filters']
  },
  pro: {
    leadsPerMonth: 1000,
    maxCampaigns: 100, // Ilimitado na prática
    maxAgents: 3,
    features: ['maps_view', 'email_support', 'premium_messages', 'can_export_csv', 'can_import_csv', 'advanced_filters', 'crm_followup']
  },
  scale: {
    leadsPerMonth: 5000,
    maxCampaigns: 100, // Ilimitado na prática
    maxAgents: 5,
    features: ['maps_view', 'email_support', 'premium_messages', 'can_export_csv', 'can_import_csv', 'advanced_filters', 'crm_followup', 'dynamic_icp', 'ab_testing', 'enrichment', 'vip_support']
  }
};

export function checkLimit(currentCount: number, plan: PlanType, limitType: keyof Omit<PlanLimits, 'features'>): { allowed: boolean; limit: number } {
  const limit = PLAN_LIMITS[plan][limitType] as number;
  return {
    allowed: currentCount < limit,
    limit
  };
}

export function hasFeature(plan: PlanType, feature: string): boolean {
  return PLAN_LIMITS[plan].features.includes(feature);
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

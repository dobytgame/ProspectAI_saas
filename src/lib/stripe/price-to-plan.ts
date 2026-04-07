import type { PlanType } from "@/utils/plan-limits";

/**
 * Mapeia Price IDs do Stripe (mensal/anual) para o slug de plano no banco.
 * Usa as mesmas env vars que o PricingGrid expõe ao cliente.
 */
export function buildStripePriceToPlanMap(): Record<string, PlanType> {
  const m: Record<string, PlanType> = {};
  const add = (id: string | undefined, plan: PlanType) => {
    const t = id?.trim();
    if (t) m[t] = plan;
  };
  add(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER_MONTHLY, "starter");
  add(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER_ANNUAL, "starter");
  add(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY, "pro");
  add(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_ANNUAL, "pro");
  add(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_SCALE_MONTHLY, "scale");
  add(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_SCALE_ANNUAL, "scale");
  return m;
}

export function planFromStripePriceId(
  priceId: string | null | undefined
): PlanType | null {
  if (!priceId) return null;
  const map = buildStripePriceToPlanMap();
  return map[priceId] ?? null;
}

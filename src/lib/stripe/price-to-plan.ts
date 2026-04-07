import type { PlanType } from "@/utils/plan-limits";

/**
 * Mapeia Price IDs do Stripe (mensal/anual) para o slug de plano no banco.
 * Usa as mesmas env vars que o PricingGrid expõe ao cliente.
 */
/** Aceita NEXT_PUBLIC_* (browser + server) ou STRIPE_* só no servidor (webhook). */
function envPrice(...keys: (string | undefined)[]): string | undefined {
  for (const k of keys) {
    const t = k?.trim();
    if (t) return t;
  }
  return undefined;
}

export function buildStripePriceToPlanMap(): Record<string, PlanType> {
  const m: Record<string, PlanType> = {};
  const add = (id: string | undefined, plan: PlanType) => {
    const t = id?.trim();
    if (t) m[t] = plan;
  };
  add(
    envPrice(
      process.env.STRIPE_PRICE_ID_STARTER_MONTHLY,
      process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER_MONTHLY
    ),
    "starter"
  );
  add(
    envPrice(
      process.env.STRIPE_PRICE_ID_STARTER_ANNUAL,
      process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER_ANNUAL
    ),
    "starter"
  );
  add(
    envPrice(
      process.env.STRIPE_PRICE_ID_PRO_MONTHLY,
      process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY
    ),
    "pro"
  );
  add(
    envPrice(
      process.env.STRIPE_PRICE_ID_PRO_ANNUAL,
      process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_ANNUAL
    ),
    "pro"
  );
  add(
    envPrice(
      process.env.STRIPE_PRICE_ID_SCALE_MONTHLY,
      process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_SCALE_MONTHLY
    ),
    "scale"
  );
  add(
    envPrice(
      process.env.STRIPE_PRICE_ID_SCALE_ANNUAL,
      process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_SCALE_ANNUAL
    ),
    "scale"
  );
  return m;
}

export function planFromStripePriceId(
  priceId: string | null | undefined
): PlanType | null {
  if (!priceId) return null;
  const map = buildStripePriceToPlanMap();
  return map[priceId] ?? null;
}

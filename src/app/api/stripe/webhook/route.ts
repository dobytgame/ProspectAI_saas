/**
 * Webhook Stripe — configure no Dashboard em:
 * https://dashboard.stripe.com/webhooks → endpoint (ex.: https://www.capturo.digital/api/stripe/webhook)
 * Eventos: checkout.session.completed, customer.subscription.created, customer.subscription.updated, customer.subscription.deleted
 *
 * Variáveis: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
 * SUPABASE_SERVICE_ROLE_KEY (obrigatória na Vercel → Production; é a "service_role" do Supabase, não a anon),
 * NEXT_PUBLIC_SUPABASE_URL,
 * e os Price IDs (NEXT_PUBLIC_STRIPE_PRICE_ID_* ou STRIPE_PRICE_ID_* — ver price-to-plan.ts).
 */
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { planFromStripePriceId, buildStripePriceToPlanMap } from "@/lib/stripe/price-to-plan";
import type { PlanType } from "@/utils/plan-limits";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_123", {
  apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  /** Só a service_role ignora RLS; anon não serve para este webhook. */
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url) {
    throw new Error(
      "Webhook Stripe: NEXT_PUBLIC_SUPABASE_URL ausente. Defina na Vercel (Production)."
    );
  }
  if (!key) {
    throw new Error(
      "Webhook Stripe: SUPABASE_SERVICE_ROLE_KEY ausente (o SDK acusa \"supabaseKey is required\"). " +
        "No Supabase: Settings → API → service_role (secret). Na Vercel: Settings → Environment Variables → Production → adicione SUPABASE_SERVICE_ROLE_KEY e faça redeploy."
    );
  }
  return createClient(url, key);
}

/** Só precisamos do admin para eventos que atualizam o Postgres. */
function eventNeedsSupabaseAdmin(type: string): boolean {
  return (
    type === "checkout.session.completed" ||
    type === "customer.subscription.created" ||
    type === "customer.subscription.deleted" ||
    type === "customer.subscription.updated"
  );
}

function stripeRefId(ref: unknown): string | null {
  if (ref == null) return null;
  if (typeof ref === "string") return ref;
  if (typeof ref === "object" && "id" in ref && typeof (ref as { id: string }).id === "string") {
    return (ref as { id: string }).id;
  }
  return null;
}

function priceIdFromStripePrice(
  raw: string | Stripe.Price | Stripe.DeletedPrice | null | undefined
): string | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "string") return raw;
  if ("deleted" in raw && raw.deleted) return undefined;
  return raw.id;
}

/** Preço efetivo da compra: assinatura (mais confiável) → session expandida → listLineItems. */
async function resolvePriceIdFromCheckoutSession(
  session: Stripe.Checkout.Session
): Promise<string | undefined> {
  const subscriptionId = stripeRefId(session.subscription);
  if (subscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["items.data.price"],
      });
      const pid = priceIdFromStripePrice(sub.items.data[0]?.price);
      if (pid) return pid;
    } catch (e) {
      console.error("webhook: subscriptions.retrieve", e);
    }
  }

  try {
    const full = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items.data.price"],
    });
    const items = full.line_items?.data ?? [];
    const pid = priceIdFromStripePrice(items[0]?.price);
    if (pid) return pid;
  } catch (e) {
    console.error("webhook: sessions.retrieve expand line_items", e);
  }

  try {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 5,
      expand: ["data.price"],
    });
    return priceIdFromStripePrice(lineItems.data[0]?.price);
  } catch (e) {
    console.error("webhook: listLineItems", e);
  }

  return undefined;
}

function planFromPriceId(priceId: string | undefined): PlanType {
  const mapped = planFromStripePriceId(priceId);
  if (mapped) return mapped;
  if (priceId) {
    console.warn(
      "webhook: priceId sem mapeamento nas env vars. Cadastre NEXT_PUBLIC_STRIPE_PRICE_ID_* ou STRIPE_PRICE_ID_* para:",
      priceId
    );
  }
  return "starter";
}

async function updateBusinessPlan(args: {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  businessId: string;
  plan: PlanType;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  context: string;
}) {
  const { supabase, businessId, plan, stripeCustomerId, stripeSubscriptionId, context } =
    args;

  const patch: Record<string, string | null> = { plan };
  if (stripeCustomerId) patch.stripe_customer_id = stripeCustomerId;
  if (stripeSubscriptionId) patch.stripe_subscription_id = stripeSubscriptionId;

  const { data, error } = await supabase
    .from("businesses")
    .update(patch)
    .eq("id", businessId)
    .select("id");

  if (error) {
    console.error(`webhook ${context}: Supabase update failed`, error.message, {
      businessId,
      plan,
    });
    return false;
  }
  if (!data?.length) {
    console.error(
      `webhook ${context}: nenhuma linha atualizada (business id inválido?)`,
      businessId
    );
    return false;
  }
  console.log(`webhook ${context}: business ${businessId} → plan ${plan}`);
  return true;
}

export async function POST(req: Request) {
  if (!endpointSecret) {
    console.error("STRIPE_WEBHOOK_SECRET não configurado");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", msg);
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  try {
    await handleStripeEvent(event);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("webhook: erro não tratado", msg, stack);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleStripeEvent(event: Stripe.Event) {
  const map = buildStripePriceToPlanMap();
  if (Object.keys(map).length === 0) {
    console.error(
      "webhook: nenhum Price ID mapeado — defina NEXT_PUBLIC_STRIPE_PRICE_ID_* (ou STRIPE_PRICE_ID_*) no ambiente do servidor."
    );
  }

  const supabaseAdmin = eventNeedsSupabaseAdmin(event.type)
    ? getSupabaseAdmin()
    : null;

  if (event.type === "checkout.session.completed") {
    if (!supabaseAdmin) {
      console.error("webhook: supabase admin ausente para checkout.session.completed");
      return;
    }
    const session = event.data.object as Stripe.Checkout.Session;
    const businessId =
      session.metadata?.businessId ||
      session.client_reference_id ||
      null;

    const customerId = stripeRefId(session.customer);
    const subscriptionId = stripeRefId(session.subscription);

    if (!businessId) {
      console.error(
        "checkout.session.completed: sem businessId (metadata.businessId / client_reference_id)"
      );
    } else {
      const priceId = await resolvePriceIdFromCheckoutSession(session);
      const plan = planFromPriceId(priceId);

      await updateBusinessPlan({
        supabase: supabaseAdmin,
        businessId,
        plan,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        context: "checkout.session.completed",
      });
    }
  }

  /** Backup: às vezes chega antes ou sem session completa; metadata vem do subscription_data no checkout. */
  if (event.type === "customer.subscription.created") {
    if (!supabaseAdmin) {
      console.error("webhook: supabase admin ausente para customer.subscription.created");
      return;
    }
    const subscription = event.data.object as Stripe.Subscription;
    const businessId = subscription.metadata?.businessId;
    if (businessId) {
      const raw = subscription.items.data[0]?.price;
      const priceId = priceIdFromStripePrice(raw);
      const plan = planFromPriceId(priceId);
      const customerId = stripeRefId(subscription.customer);

      await updateBusinessPlan({
        supabase: supabaseAdmin,
        businessId,
        plan,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        context: "customer.subscription.created",
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    if (!supabaseAdmin) {
      console.error("webhook: supabase admin ausente para customer.subscription.deleted");
      return;
    }
    const subscription = event.data.object as Stripe.Subscription;

    const { error } = await supabaseAdmin
      .from("businesses")
      .update({
        plan: "free",
        stripe_subscription_id: null,
      })
      .eq("stripe_subscription_id", subscription.id);

    if (error) {
      console.error("subscription.deleted: Supabase", error.message);
    } else {
      console.log(`Subscription ${subscription.id} deleted → plan free.`);
    }
  }

  if (event.type === "customer.subscription.updated") {
    if (!supabaseAdmin) {
      console.error("webhook: supabase admin ausente para customer.subscription.updated");
      return;
    }
    const subscription = event.data.object as Stripe.Subscription;

    if (
      subscription.status === "past_due" ||
      subscription.status === "unpaid" ||
      subscription.status === "canceled"
    ) {
      const { error } = await supabaseAdmin
        .from("businesses")
        .update({ plan: "free" })
        .eq("stripe_subscription_id", subscription.id);

      if (error) {
        console.error("subscription.updated (downgrade): Supabase", error.message);
      }
    } else if (
      subscription.status === "active" ||
      subscription.status === "trialing"
    ) {
      const raw = subscription.items.data[0]?.price;
      const priceId = priceIdFromStripePrice(raw);
      const resolved = planFromStripePriceId(priceId);
      if (resolved) {
        const { error } = await supabaseAdmin
          .from("businesses")
          .update({ plan: resolved })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error("subscription.updated (active): Supabase", error.message);
        }
      } else if (priceId) {
        console.warn(
          "subscription.updated active: priceId sem mapeamento:",
          priceId
        );
      }
    }
  }
}

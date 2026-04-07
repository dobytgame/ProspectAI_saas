import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { planFromStripePriceId } from "@/lib/stripe/price-to-plan";
import type { PlanType } from "@/utils/plan-limits";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_123", {
  apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature!, endpointSecret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", msg);
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const businessId =
      session.metadata?.businessId || session.client_reference_id || null;

    const customerId = session.customer as string | null;
    const subscriptionId = session.subscription as string | null;

    if (!businessId) {
      console.error(
        "checkout.session.completed: sem businessId (metadata.businessId / client_reference_id)"
      );
    } else {
      let resolvedPlan: PlanType | null = null;
      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(
          session.id,
          { limit: 5 }
        );
        const priceId = lineItems.data[0]?.price?.id;
        resolvedPlan = planFromStripePriceId(priceId);
        if (!resolvedPlan && priceId) {
          console.warn(
            "checkout.session.completed: priceId sem mapeamento em env:",
            priceId
          );
        }
      } catch (e) {
        console.error("checkout.session.completed: listLineItems", e);
      }

      const plan: PlanType = resolvedPlan ?? "starter";

      await supabaseAdmin
        .from("businesses")
        .update({
          plan,
          stripe_customer_id: customerId ?? undefined,
          stripe_subscription_id: subscriptionId ?? undefined,
        })
        .eq("id", businessId);

      console.log(`Business ${businessId} → plan ${plan} (checkout completed).`);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;

    await supabaseAdmin
      .from("businesses")
      .update({
        plan: "free",
        stripe_subscription_id: null,
      })
      .eq("stripe_subscription_id", subscription.id);

    console.log(`Subscription ${subscription.id} deleted → plan free.`);
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;

    if (
      subscription.status === "past_due" ||
      subscription.status === "unpaid" ||
      subscription.status === "canceled"
    ) {
      await supabaseAdmin
        .from("businesses")
        .update({ plan: "free" })
        .eq("stripe_subscription_id", subscription.id);
    } else if (
      subscription.status === "active" ||
      subscription.status === "trialing"
    ) {
      const raw = subscription.items.data[0]?.price;
      const priceId =
        typeof raw === "string" ? raw : raw && "id" in raw ? raw.id : undefined;
      const resolved = planFromStripePriceId(priceId);
      if (resolved) {
        await supabaseAdmin
          .from("businesses")
          .update({ plan: resolved })
          .eq("stripe_subscription_id", subscription.id);
      } else if (priceId) {
        console.warn(
          "subscription.updated active: priceId sem mapeamento:",
          priceId
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}

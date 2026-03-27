import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_123', {
  apiVersion: '2023-10-16' as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature!, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  const { createClient: createSupabase } = require('@supabase/supabase-js');
  const supabaseAdmin = createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const businessId = session.client_reference_id;
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    if (businessId) {
      await supabaseAdmin
        .from('businesses')
        .update({
          plan: 'pro',
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
        })
        .eq('id', businessId);
      
      console.log(`Business ${businessId} upgraded to Pro.`);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    
    await supabaseAdmin
      .from('businesses')
      .update({
        plan: 'free',
        stripe_subscription_id: null,
      })
      .eq('stripe_subscription_id', subscription.id);
    
    console.log(`Subscription ${subscription.id} deleted. Plan reverted to free.`);
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription;
    
    if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
      await supabaseAdmin
        .from('businesses')
        .update({ plan: 'free' })
        .eq('stripe_subscription_id', subscription.id);
    } else if (subscription.status === 'active') {
      await supabaseAdmin
        .from('businesses')
        .update({ plan: 'pro' })
        .eq('stripe_subscription_id', subscription.id);
    }
  }

  return NextResponse.json({ received: true });
}

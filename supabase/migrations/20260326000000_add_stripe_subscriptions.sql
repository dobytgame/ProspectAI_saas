-- Add subscription data to businesses
alter table public.businesses 
add column if not exists plan text default 'free',
add column if not exists stripe_customer_id text,
add column if not exists stripe_subscription_id text;

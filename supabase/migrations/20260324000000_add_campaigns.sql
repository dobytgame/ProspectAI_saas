-- ProspectAI — Campaigns table + missing schema fixes
-- This migration adds the campaigns table and fixes missing columns/constraints

-- Tabela: campaigns
create table if not exists public.campaigns (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses on delete cascade not null,
  name text not null,
  description text,
  channel text not null default 'whatsapp',
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.campaigns enable row level security;
create policy "Users can only access their own campaigns" on public.campaigns
  for all using (
    exists (
      select 1 from public.businesses
      where businesses.id = campaigns.business_id
      and businesses.user_id = auth.uid()
    )
  );

-- Campo campaign_id em leads
alter table public.leads
  add column if not exists campaign_id uuid references public.campaigns on delete set null;

-- Índices para performance
create index if not exists leads_campaign_id_idx on public.leads(campaign_id);
create index if not exists leads_business_id_idx on public.leads(business_id);
create index if not exists leads_score_idx on public.leads(score desc);

-- Campo website em businesses
alter table public.businesses
  add column if not exists website text;

-- Constraint UNIQUE em user_id para o upsert do onboarding funcionar
alter table public.businesses
  add constraint businesses_user_id_unique unique (user_id);

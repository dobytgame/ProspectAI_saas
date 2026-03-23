-- ProspectAI Initial Schema

-- Enable RLS
create extension if not exists "uuid-ossp";

-- 1. Businesses
create table if not exists public.businesses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  name text not null,
  segment text,
  icp jsonb default '{}'::jsonb,
  tone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.businesses enable row level security;
create policy "Users can only access their own businesses" on public.businesses
  for all using (auth.uid() = user_id);

-- 2. Agents
create table if not exists public.agents (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses on delete cascade not null,
  config jsonb default '{}'::jsonb,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.agents enable row level security;
create policy "Users can only access agents of their businesses" on public.agents
  for all using (
    exists (
      select 1 from public.businesses
      where businesses.id = agents.business_id
      and businesses.user_id = auth.uid()
    )
  );

-- 3. Prospecting Jobs
create table if not exists public.prospecting_jobs (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses on delete cascade not null,
  region text,
  filters jsonb default '{}'::jsonb,
  status text default 'pending', -- pending, running, completed, failed
  progress integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.prospecting_jobs enable row level security;
create policy "Users can only access jobs of their businesses" on public.prospecting_jobs
  for all using (
    exists (
      select 1 from public.businesses
      where businesses.id = prospecting_jobs.business_id
      and businesses.user_id = auth.uid()
    )
  );

-- 4. Leads
create table if not exists public.leads (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid references public.prospecting_jobs on delete set null,
  business_id uuid references public.businesses on delete cascade not null,
  name text not null,
  address text,
  phone text,
  website text,
  score integer default 0,
  segment text,
  status text default 'new', -- new, contacted, interested, closed, rejected
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.leads enable row level security;
create policy "Users can only access leads of their businesses" on public.leads
  for all using (
    exists (
      select 1 from public.businesses
      where businesses.id = leads.business_id
      and businesses.user_id = auth.uid()
    )
  );

-- 5. Lead Messages
create table if not exists public.lead_messages (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references public.leads on delete cascade not null,
  channel text not null, -- whatsapp, email
  content text not null,
  status text default 'pending', -- pending, sent, failed, read
  sent_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.lead_messages enable row level security;
create policy "Users can only access messages of their leads" on public.lead_messages
  for all using (
    exists (
      select 1 from public.leads
      join public.businesses on businesses.id = leads.business_id
      where leads.id = lead_messages.lead_id
      and businesses.user_id = auth.uid()
    )
  );

-- 6. Lead Interactions
create table if not exists public.lead_interactions (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references public.leads on delete cascade not null,
  type text not null, -- reply, click, open
  data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.lead_interactions enable row level security;
create policy "Users can only access interactions of their leads" on public.lead_interactions
  for all using (
    exists (
      select 1 from public.leads
      join public.businesses on businesses.id = leads.business_id
      where leads.id = lead_interactions.lead_id
      and businesses.user_id = auth.uid()
    )
  );

-- 7. Templates
create table if not exists public.templates (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses on delete cascade not null,
  name text not null,
  content text not null,
  channel text not null, -- whatsapp, email
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.templates enable row level security;
create policy "Users can only access templates of their businesses" on public.templates
  for all using (
    exists (
      select 1 from public.businesses
      where businesses.id = templates.business_id
      and businesses.user_id = auth.uid()
    )
  );

-- 8. Kanban Stages
create table if not exists public.kanban_stages (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses on delete cascade not null,
  name text not null,
  "order" integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.kanban_stages enable row level security;
create policy "Users can only access stages of their businesses" on public.kanban_stages
  for all using (
    exists (
      select 1 from public.businesses
      where businesses.id = kanban_stages.business_id
      and businesses.user_id = auth.uid()
    )
  );

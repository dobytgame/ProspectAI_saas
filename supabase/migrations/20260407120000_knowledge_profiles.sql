-- Perfis de conhecimento para campanhas (texto + URL + até 3 arquivos, sintetizados pela IA)

create table if not exists public.knowledge_profiles (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses on delete cascade not null,
  name text not null,
  status text not null default 'processing' check (status in ('processing', 'completed', 'failed')),
  campaign_brief text,
  structured jsonb default '{}'::jsonb,
  ai_feedback text,
  source_summary text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists knowledge_profiles_business_id_idx
  on public.knowledge_profiles (business_id);

alter table public.knowledge_profiles enable row level security;

create policy "Users manage knowledge profiles of their businesses"
  on public.knowledge_profiles
  for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = knowledge_profiles.business_id
        and b.user_id = auth.uid()
    )
  );

alter table public.campaigns
  add column if not exists knowledge_profile_id uuid references public.knowledge_profiles (id) on delete set null;

create index if not exists campaigns_knowledge_profile_id_idx
  on public.campaigns (knowledge_profile_id)
  where knowledge_profile_id is not null;

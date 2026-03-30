-- Integrações / extras em JSON (usado em settings/actions.ts)
alter table public.businesses
  add column if not exists metadata jsonb not null default '{}'::jsonb;

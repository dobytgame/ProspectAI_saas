-- Migration: analytics_and_indexes
-- Executar no Supabase SQL Editor

-- Adicionar campo updated_at com auto-update (se não existir)
alter table public.leads
  add column if not exists updated_at timestamp with time zone
  default timezone('utc'::text, now());

-- Índice para busca rápida de atividade recente
create index if not exists leads_updated_at_idx
  on public.leads(updated_at desc);

-- Índice para filtro por status no pipeline
create index if not exists leads_status_idx
  on public.leads(status);

-- Índice composto para dashboard analytics
create index if not exists leads_business_status_idx
  on public.leads(business_id, status);

-- Trigger para auto-update do updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  NEW.updated_at = timezone('utc'::text, now());
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists leads_updated_at_trigger on public.leads;
create trigger leads_updated_at_trigger
  before update on public.leads
  for each row execute function update_updated_at();

-- Função SQL para stats do funil (usada pelo dashboard)
create or replace function get_pipeline_stats(p_business_id uuid)
returns json as $$
  select json_build_object(
    'total',      count(*),
    'contacted',  count(*) filter (where status in ('contacted','interested','negotiating','closed')),
    'interested', count(*) filter (where status in ('interested','negotiating','closed')),
    'closed',     count(*) filter (where status = 'closed'),
    'avg_score',  round(avg(score)::numeric, 1),
    'top_leads',  (
      select json_agg(sub) from (
        select id, name, score, status, metadata->>'tier' as tier
        from public.leads
        where business_id = p_business_id
        order by score desc
        limit 5
      ) sub
    )
  )
  from public.leads
  where business_id = p_business_id
$$ language sql security definer;

-- Estado de paginação Places (próxima página / profundidade) por campanha
alter table public.campaigns
  add column if not exists discovery_state jsonb;

comment on column public.campaigns.discovery_state is
  'JSON: query, region, next_page_token, pages_fetched, max_pages (limite do plano)';

-- Bucket privado para arquivos da base de conhecimento (PDF, txt, etc.).
-- Upload/delete via service_role nas API routes.

insert into storage.buckets (id, name, public)
values ('knowledge_base', 'knowledge_base', false)
on conflict (id) do nothing;

-- Monthly lead usage counter (referenced by lead-actions, pipeline/actions)
alter table public.businesses
  add column if not exists leads_used_this_month integer not null default 0;

-- Atomic increment; SECURITY DEFINER with ownership check (RLS bypass safe)
create or replace function public.increment_business_leads(p_business_id uuid, p_count integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_count is null or p_count < 1 then
    return;
  end if;

  update public.businesses b
  set leads_used_this_month = coalesce(b.leads_used_this_month, 0) + p_count
  where b.id = p_business_id
    and b.user_id = auth.uid();
end;
$$;

revoke all on function public.increment_business_leads(uuid, integer) from public;
grant execute on function public.increment_business_leads(uuid, integer) to authenticated;

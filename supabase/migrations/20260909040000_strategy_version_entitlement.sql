-- Personal Strategy versions require the commercial entitlement.
create or replace function public.enforce_strategy_version_entitlement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then return new; end if;
  if new.created_by is null or new.created_by = auth.uid() then
    if not public.has_my_entitlement('strategy_versions_personal') then
      raise exception 'Entitlement required: strategy_versions_personal' using errcode = '42501';
    end if;
  elsif not public.has_my_entitlement('coach_draft_publish') then
    raise exception 'Entitlement required: coach_draft_publish' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_strategy_version_entitlement on public.strategy_versions;
create trigger enforce_strategy_version_entitlement
before insert on public.strategy_versions
for each row execute function public.enforce_strategy_version_entitlement();

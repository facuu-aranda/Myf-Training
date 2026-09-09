-- Server-side commercial gates for user-created content.
-- The UI gate is only a convenience; these triggers protect RPC and direct writes.

create or replace function public.has_my_entitlement(entitlement_key text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((public.get_my_effective_entitlements() ->> entitlement_key)::boolean, false);
$$;

grant execute on function public.has_my_entitlement(text) to authenticated;

create or replace function public.enforce_custom_food_entitlement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then return new; end if;
  if new.source_type = 'user' and not public.has_my_entitlement('custom_foods_create') then
    raise exception 'Entitlement required: custom_foods_create' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_custom_food_entitlement on public.foods;
create trigger enforce_custom_food_entitlement
before insert on public.foods
for each row execute function public.enforce_custom_food_entitlement();

create or replace function public.enforce_custom_exercise_entitlement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then return new; end if;
  if new.source = 'user-custom' and not public.has_my_entitlement('custom_exercises_create') then
    raise exception 'Entitlement required: custom_exercises_create' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_custom_exercise_entitlement on public.exercises;
create trigger enforce_custom_exercise_entitlement
before insert on public.exercises
for each row execute function public.enforce_custom_exercise_entitlement();

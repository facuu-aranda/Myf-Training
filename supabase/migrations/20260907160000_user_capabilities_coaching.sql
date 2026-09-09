begin;

create table if not exists public.user_capabilities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  capability text not null check (capability in ('household_create', 'coaching_create')),
  status text not null default 'active' check (status in ('active', 'disabled', 'revoked')),
  source text not null default 'system' check (source in ('system', 'admin', 'migration', 'future_billing')),
  granted_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, capability)
);

create index if not exists user_capabilities_active_idx on public.user_capabilities(user_id, capability, status);
alter table public.user_capabilities enable row level security;

create policy user_capabilities_select_own on public.user_capabilities
  for select using (user_id = auth.uid());

grant select on public.user_capabilities to authenticated;

create or replace function public.has_capability(target_capability text, target_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.user_capabilities
    where user_id = target_user_id
      and capability = target_capability
      and status = 'active'
      and (expires_at is null or expires_at > timezone('utc', now()))
  );
$$;

grant execute on function public.has_capability(text, uuid) to authenticated;

insert into public.user_capabilities (user_id, capability, source, metadata)
select distinct owner_user_id, 'coaching_create', 'migration', jsonb_build_object('reason', 'existing coaching space owner')
from public.spaces
where type = 'coaching'
on conflict (user_id, capability) do nothing;

create or replace function public.create_coaching_space(space_name text, member_limit integer default 50)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  new_space_id uuid := gen_random_uuid();
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if not public.has_capability('coaching_create', current_user_id) then raise exception 'Coaching capability is not enabled'; end if;
  if space_name is null or length(btrim(space_name)) not between 1 and 160 then raise exception 'Invalid space name'; end if;
  if member_limit is null or member_limit < 1 or member_limit > 10000 then raise exception 'Invalid member limit'; end if;
  insert into public.spaces (id, owner_user_id, name, type, max_members)
  values (new_space_id, current_user_id, btrim(space_name), 'coaching', member_limit);
  insert into public.space_members (space_id, user_id, role, status)
  values (new_space_id, current_user_id, 'owner', 'active');
  return new_space_id;
end;
$$;

grant execute on function public.create_coaching_space(text, integer) to authenticated;

commit;

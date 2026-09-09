begin;

create table if not exists public.strategy_management (
  id uuid primary key default gen_random_uuid(),
  athlete_user_id uuid not null references public.profiles(id) on delete cascade,
  manager_user_id uuid references public.profiles(id) on delete set null,
  space_id uuid references public.spaces(id) on delete set null,
  relationship_id uuid references public.coach_athlete_relationships(id) on delete set null,
  management_mode text not null default 'self' check (management_mode in ('self', 'coach')),
  status text not null default 'active' check (status in ('active', 'ended')),
  started_at timestamptz not null default timezone('utc', now()),
  ended_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (athlete_user_id)
);

create index if not exists strategy_management_manager_idx on public.strategy_management(manager_user_id, status);
create index if not exists strategy_management_space_idx on public.strategy_management(space_id, status);
alter table public.strategy_management enable row level security;

create policy strategy_management_select_authorized on public.strategy_management
  for select using (
    athlete_user_id = auth.uid()
    or manager_user_id = auth.uid()
    or (space_id is not null and public.is_space_member(space_id))
  );

grant select on public.strategy_management to authenticated;

create or replace function public.get_strategy_management(target_athlete_id uuid)
returns table (
  athlete_user_id uuid,
  manager_user_id uuid,
  space_id uuid,
  relationship_id uuid,
  management_mode text,
  status text,
  started_at timestamptz,
  ended_at timestamptz
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if auth.uid() <> target_athlete_id and not exists (
    select 1
    from public.coach_athlete_relationships relation
    where relation.athlete_user_id = target_athlete_id
      and relation.coach_user_id = auth.uid()
      and relation.status = 'active'
  ) then
    raise exception 'Not authorized to view strategy management';
  end if;

  return query
  select management.athlete_user_id, management.manager_user_id, management.space_id, management.relationship_id, management.management_mode, management.status, management.started_at, management.ended_at
  from public.strategy_management management
  where management.athlete_user_id = target_athlete_id
    and management.status = 'active';
end;
$$;

grant execute on function public.get_strategy_management(uuid) to authenticated;

create or replace function public.start_coach_strategy_management(target_space_id uuid, target_athlete_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  relationship record;
begin
  select relation.* into relationship
  from public.coach_athlete_relationships relation
  where relation.space_id = target_space_id
    and relation.athlete_user_id = target_athlete_id
    and relation.coach_user_id = current_user_id
    and relation.status = 'active';
  if relationship.id is null then raise exception 'No active coach relationship'; end if;
  if not exists (select 1 from public.space_members member where member.space_id = target_space_id and member.user_id = current_user_id and member.role in ('owner', 'coach') and member.status = 'active' and member.left_at is null) then raise exception 'Not authorized to manage strategy'; end if;
  insert into public.strategy_management (athlete_user_id, manager_user_id, space_id, relationship_id, management_mode, status, started_at, ended_at)
  values (target_athlete_id, current_user_id, target_space_id, relationship.id, 'coach', 'active', timezone('utc', now()), null)
  on conflict (athlete_user_id) do update set manager_user_id = excluded.manager_user_id, space_id = excluded.space_id, relationship_id = excluded.relationship_id, management_mode = 'coach', status = 'active', started_at = timezone('utc', now()), ended_at = null, updated_at = timezone('utc', now());
  return true;
end;
$$;

grant execute on function public.start_coach_strategy_management(uuid, uuid) to authenticated;

create or replace function public.release_coach_strategy_management(target_athlete_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  management record;
begin
  select * into management from public.strategy_management where athlete_user_id = target_athlete_id and status = 'active';
  if management.id is null then return true; end if;
  if management.manager_user_id <> auth.uid() and management.athlete_user_id <> auth.uid() then raise exception 'Not authorized to release strategy management'; end if;
  update public.strategy_management set manager_user_id = null, space_id = null, relationship_id = null, management_mode = 'self', status = 'active', ended_at = timezone('utc', now()), updated_at = timezone('utc', now()) where id = management.id;
  return true;
end;
$$;

grant execute on function public.release_coach_strategy_management(uuid) to authenticated;

commit;

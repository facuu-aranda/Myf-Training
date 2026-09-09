begin;

create table if not exists public.spaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 160),
  type text not null default 'coaching' check (type in ('duo', 'household', 'coaching')),
  max_members integer not null default 50 check (max_members > 0),
  status text not null default 'active' check (status in ('active', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.space_members (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'coach', 'athlete', 'member', 'admin')),
  status text not null default 'active' check (status in ('pending', 'active', 'inactive')),
  joined_at timestamptz not null default timezone('utc', now()),
  left_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (space_id, user_id)
);

create table if not exists public.coach_athlete_relationships (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  coach_user_id uuid not null references public.profiles(id) on delete cascade,
  athlete_user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'active', 'paused', 'revoked', 'ended')),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (coach_user_id <> athlete_user_id),
  unique (space_id, coach_user_id, athlete_user_id)
);

create index if not exists spaces_owner_idx on public.spaces(owner_user_id, status);
create index if not exists space_members_user_idx on public.space_members(user_id, status);
create index if not exists space_members_space_idx on public.space_members(space_id, status);
create index if not exists coach_athlete_space_idx on public.coach_athlete_relationships(space_id, status);
create index if not exists coach_athlete_athlete_idx on public.coach_athlete_relationships(athlete_user_id, status);

create or replace function public.is_space_member(target_space_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.space_members
    where space_id = target_space_id
      and user_id = target_user_id
      and status = 'active'
      and left_at is null
  );
$$;

grant execute on function public.is_space_member(uuid, uuid) to authenticated;

create or replace function public.is_space_owner(target_space_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.spaces
    where id = target_space_id and owner_user_id = target_user_id and status = 'active'
  );
$$;

grant execute on function public.is_space_owner(uuid, uuid) to authenticated;

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

alter table public.spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.coach_athlete_relationships enable row level security;

create policy spaces_select_visible on public.spaces
  for select using (owner_user_id = auth.uid() or public.is_space_member(id));
create policy spaces_insert_own on public.spaces
  for insert with check (owner_user_id = auth.uid());
create policy spaces_update_owner on public.spaces
  for update using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy spaces_delete_owner on public.spaces
  for delete using (owner_user_id = auth.uid());

create policy space_members_select_visible on public.space_members
  for select using (user_id = auth.uid() or public.is_space_owner(space_id) or public.is_space_member(space_id));
create policy space_members_insert_owner on public.space_members
  for insert with check (public.is_space_owner(space_id));
create policy space_members_update_owner on public.space_members
  for update using (public.is_space_owner(space_id)) with check (public.is_space_owner(space_id));
create policy space_members_delete_owner_or_self on public.space_members
  for delete using (public.is_space_owner(space_id) or user_id = auth.uid());

create policy coach_relationships_select_participants on public.coach_athlete_relationships
  for select using (coach_user_id = auth.uid() or athlete_user_id = auth.uid() or public.is_space_member(space_id));
create policy coach_relationships_insert_coach_or_owner on public.coach_athlete_relationships
  for insert with check ((coach_user_id = auth.uid() or public.is_space_owner(space_id)) and public.is_space_member(space_id, coach_user_id) and public.is_space_member(space_id, athlete_user_id));
create policy coach_relationships_update_coach_or_owner on public.coach_athlete_relationships
  for update using (coach_user_id = auth.uid() or public.is_space_owner(space_id)) with check (coach_user_id = auth.uid() or public.is_space_owner(space_id));
create policy coach_relationships_delete_coach_or_owner on public.coach_athlete_relationships
  for delete using (coach_user_id = auth.uid() or public.is_space_owner(space_id));

grant select, insert, update, delete on public.spaces to authenticated;
grant select, insert, update, delete on public.space_members to authenticated;
grant select, insert, update, delete on public.coach_athlete_relationships to authenticated;

commit;

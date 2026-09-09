begin;

create table if not exists public.coach_relationship_permissions (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.coach_athlete_relationships(id) on delete cascade,
  permission text not null check (permission in ('strategy_view', 'strategy_manage', 'progress_view', 'execution_view', 'nutrition_view', 'nutrition_manage', 'notes_manage', 'athlete_manage')),
  enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (relationship_id, permission)
);

create index if not exists coach_relationship_permissions_lookup_idx on public.coach_relationship_permissions(relationship_id, permission, enabled);
alter table public.coach_relationship_permissions enable row level security;

create policy coach_relationship_permissions_select_authorized on public.coach_relationship_permissions
  for select using (
    exists (
      select 1 from public.coach_athlete_relationships relation
      where relation.id = relationship_id and (relation.coach_user_id = auth.uid() or relation.athlete_user_id = auth.uid())
    )
  );

grant select on public.coach_relationship_permissions to authenticated;

grant execute on function public.has_capability(text, uuid) to authenticated;

create or replace function public.has_coach_permission(target_space_id uuid, target_athlete_id uuid, target_permission text, actor_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.coach_athlete_relationships relation
    join public.coach_relationship_permissions permission on permission.relationship_id = relation.id
    where relation.space_id = target_space_id
      and relation.athlete_user_id = target_athlete_id
      and relation.coach_user_id = actor_user_id
      and relation.status = 'active'
      and permission.permission = target_permission
      and permission.enabled = true
  );
$$;

grant execute on function public.has_coach_permission(uuid, uuid, text, uuid) to authenticated;

create or replace function public.seed_coach_relationship_permissions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.coach_relationship_permissions (relationship_id, permission)
  select new.id, permission_name
  from unnest(array['strategy_view', 'strategy_manage', 'progress_view', 'execution_view', 'nutrition_view', 'nutrition_manage', 'notes_manage', 'athlete_manage']::text[]) permission_name
  on conflict (relationship_id, permission) do nothing;
  return new;
end;
$$;

drop trigger if exists coach_relationship_permissions_seed on public.coach_athlete_relationships;
create trigger coach_relationship_permissions_seed
after insert on public.coach_athlete_relationships
for each row execute function public.seed_coach_relationship_permissions();

insert into public.coach_relationship_permissions (relationship_id, permission)
select relation.id, permission_name
from public.coach_athlete_relationships relation
cross join unnest(array['strategy_view', 'strategy_manage', 'progress_view', 'execution_view', 'nutrition_view', 'nutrition_manage', 'notes_manage', 'athlete_manage']::text[]) permission_name
where relation.status in ('pending', 'active', 'paused')
on conflict (relationship_id, permission) do nothing;

commit;

begin;

alter table public.strategy_versions
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists space_id uuid references public.spaces(id) on delete set null,
  add column if not exists relationship_id uuid references public.coach_athlete_relationships(id) on delete set null,
  add column if not exists version_number integer,
  add column if not exists status text not null default 'published',
  add column if not exists change_reason text not null default '',
  add column if not exists effective_from date,
  add column if not exists effective_until date,
  add column if not exists published_at timestamptz;

update public.strategy_versions
set created_by = coalesce(created_by, user_id),
    version_number = coalesce(version_number, 1),
    effective_from = coalesce(effective_from, starts_on),
    published_at = coalesce(published_at, created_at)
where created_by is null or version_number is null or effective_from is null or published_at is null;

alter table public.strategy_versions drop constraint if exists strategy_versions_status_check;
alter table public.strategy_versions add constraint strategy_versions_status_check check (status in ('draft', 'published', 'archived'));
create index if not exists strategy_versions_subject_idx on public.strategy_versions(user_id, version_number desc);
create index if not exists strategy_versions_space_idx on public.strategy_versions(space_id, status);

create or replace function public.create_coach_strategy_draft(target_space_id uuid, target_athlete_id uuid, reason text default '')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  relationship record;
  draft_id uuid := gen_random_uuid();
  next_version integer;
  snapshot_data jsonb;
begin
  if not public.has_coach_permission(target_space_id, target_athlete_id, 'strategy_manage') then raise exception 'Not authorized to create Strategy draft'; end if;
  select relation.* into relationship from public.coach_athlete_relationships relation where relation.space_id = target_space_id and relation.coach_user_id = current_user_id and relation.athlete_user_id = target_athlete_id and relation.status = 'active';
  if relationship.id is null then raise exception 'No active coach relationship'; end if;
  select coalesce(max(version_number), 0) + 1 into next_version from public.strategy_versions where user_id = target_athlete_id;
  select jsonb_build_object(
    'profile', (select to_jsonb(profile) - 'email' - 'username' - 'password_hash' from public.profiles profile where profile.id = target_athlete_id),
    'nutrition', (select to_jsonb(plan) from public.nutrition_plans plan where plan.user_id = target_athlete_id),
    'workoutDays', (select coalesce(jsonb_agg(to_jsonb(day) || jsonb_build_object('exercises', (select coalesce(jsonb_agg(to_jsonb(exercise) order by exercise.order_index), '[]'::jsonb) from public.workout_exercises exercise where exercise.workout_day_id = day.id)) order by day.order_index), '[]'::jsonb) from public.workout_days day where day.user_id = target_athlete_id and day.active = true)
  ) into snapshot_data;
  insert into public.strategy_versions (id, user_id, created_by, space_id, relationship_id, name, starts_on, is_current, snapshot, version_number, status, change_reason)
  values (draft_id, target_athlete_id, current_user_id, target_space_id, relationship.id, 'Coach Strategy Draft', current_date, false, snapshot_data, next_version, 'draft', coalesce(reason, ''));
  return draft_id;
end;
$$;

grant execute on function public.create_coach_strategy_draft(uuid, uuid, text) to authenticated;

commit;

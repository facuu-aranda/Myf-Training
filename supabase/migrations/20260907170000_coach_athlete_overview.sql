begin;

create or replace function public.get_coach_athlete_overview(target_space_id uuid, target_athlete_id uuid)
returns table (
  athlete_user_id uuid,
  display_name text,
  public_handle text,
  public_code text,
  avatar_url text,
  relationship_status text,
  relationship_started_at timestamptz,
  daily_step_goal integer,
  daily_calorie_goal integer,
  weight_kg numeric,
  latest_body_weight numeric,
  latest_steps integer,
  last_workout_at timestamptz,
  workouts_last_7_days bigint,
  volume_last_7_days numeric,
  personal_records_count bigint
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.space_members member
    where member.space_id = target_space_id
      and member.user_id = auth.uid()
      and member.role in ('owner', 'coach')
      and member.status = 'active'
      and member.left_at is null
  ) then
    raise exception 'Not authorized to view athlete';
  end if;

  return query
  select
    relation.athlete_user_id,
    profile.display_name,
    profile.public_handle,
    profile.public_code,
    profile.avatar_url,
    relation.status,
    relation.started_at,
    profile.daily_step_goal,
    profile.daily_calorie_goal,
    profile.weight_kg,
    latest_metric.body_weight,
    latest_metric.steps,
    workout_stats.last_workout_at,
    workout_stats.workouts_last_7_days,
    workout_stats.volume_last_7_days,
    (select count(*) from public.personal_records record where record.user_id = target_athlete_id) as personal_records_count
  from public.coach_athlete_relationships relation
  join public.profiles profile on profile.id = relation.athlete_user_id
  left join lateral (
    select metric.body_weight, metric.steps
    from public.daily_metrics metric
    where metric.user_id = target_athlete_id
    order by metric.date desc
    limit 1
  ) latest_metric on true
  left join lateral (
    select
      max(session.started_at) as last_workout_at,
      count(*) filter (where session.started_at >= timezone('utc', now()) - interval '7 days') as workouts_last_7_days,
      coalesce(sum(set.actual_weight * set.actual_reps) filter (where session.started_at >= timezone('utc', now()) - interval '7 days'), 0) as volume_last_7_days
    from public.workout_sessions session
    left join public.exercise_sets set on set.session_id = session.id
    where session.user_id = target_athlete_id
      and session.status = 'completed'
  ) workout_stats on true
  where relation.space_id = target_space_id
    and relation.athlete_user_id = target_athlete_id
    and relation.status = 'active';
end;
$$;

grant execute on function public.get_coach_athlete_overview(uuid, uuid) to authenticated;

commit;

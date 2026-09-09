begin;

create or replace function public.publish_coach_strategy(draft_version_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  draft record;
  snapshot_data jsonb;
  snapshot_profile jsonb;
  snapshot_nutrition jsonb;
  snapshot_day jsonb;
  snapshot_exercise jsonb;
  new_day_id uuid;
  published_version integer;
  exercise_id_value uuid;
begin
  select version.* into draft from public.strategy_versions version where version.id = draft_version_id and version.status = 'draft' for update;
  if draft.id is null then raise exception 'Strategy draft not found'; end if;
  if draft.space_id is null or draft.user_id is null then raise exception 'Strategy draft is not scoped'; end if;
  if not public.has_coach_permission(draft.space_id, draft.user_id, 'strategy_manage', current_user_id) then raise exception 'Not authorized to publish Strategy'; end if;
  snapshot_data := draft.snapshot;
  snapshot_profile := snapshot_data->'profile';
  snapshot_nutrition := snapshot_data->'nutrition';
  if snapshot_profile is null or snapshot_nutrition is null then raise exception 'Invalid Strategy snapshot'; end if;
  if (snapshot_profile->>'daily_step_goal')::integer < 0 or (snapshot_nutrition->>'calories')::integer <= 0 then raise exception 'Invalid Strategy goals'; end if;

  update public.strategy_versions set is_current = false, status = 'archived', effective_until = current_date - 1 where user_id = draft.user_id and is_current = true;
  update public.profiles set daily_step_goal = (snapshot_profile->>'daily_step_goal')::integer, daily_calorie_goal = (snapshot_profile->>'daily_calorie_goal')::integer, updated_at = timezone('utc', now()) where id = draft.user_id;
  update public.nutrition_plans set calories = (snapshot_nutrition->>'calories')::integer, protein = (snapshot_nutrition->>'protein')::numeric, carbs = (snapshot_nutrition->>'carbs')::numeric, fats = (snapshot_nutrition->>'fats')::numeric, fiber = (snapshot_nutrition->>'fiber')::numeric, notes = coalesce(snapshot_nutrition->>'notes', ''), updated_at = timezone('utc', now()) where user_id = draft.user_id;

  update public.workout_days set active = false, updated_at = timezone('utc', now()) where user_id = draft.user_id and active = true;
  for snapshot_day in select value from jsonb_array_elements(coalesce(snapshot_data->'workoutDays', '[]'::jsonb)) loop
    new_day_id := gen_random_uuid();
    insert into public.workout_days (id, user_id, name, name_es, description, weekday, order_index, active, estimated_minutes)
    values (new_day_id, draft.user_id, coalesce(snapshot_day->>'name', 'Training day'), coalesce(snapshot_day->>'name_es', snapshot_day->>'name', 'Training day'), coalesce(snapshot_day->>'description', ''), (snapshot_day->>'weekday')::integer, coalesce((snapshot_day->>'order_index')::integer, 0), true, coalesce((snapshot_day->>'estimated_minutes')::integer, 45));
    for snapshot_exercise in select value from jsonb_array_elements(coalesce(snapshot_day->'exercises', '[]'::jsonb)) loop
      exercise_id_value := (snapshot_exercise->>'exercise_id')::uuid;
      if not exists (select 1 from public.exercises where id = exercise_id_value) then raise exception 'Exercise in Strategy snapshot is unavailable'; end if;
      insert into public.workout_exercises (workout_day_id, exercise_id, order_index, sets, target_reps, target_seconds, target_weight, rest_seconds, notes)
      values (new_day_id, exercise_id_value, coalesce((snapshot_exercise->>'order_index')::integer, 0), coalesce((snapshot_exercise->>'sets')::integer, 3), coalesce((snapshot_exercise->>'target_reps')::integer, 10), (snapshot_exercise->>'target_seconds')::integer, coalesce((snapshot_exercise->>'target_weight')::numeric, 0), coalesce((snapshot_exercise->>'rest_seconds')::integer, 60), coalesce(snapshot_exercise->>'notes', ''));
    end loop;
  end loop;

  select coalesce(max(version_number), 0) into published_version from public.strategy_versions where user_id = draft.user_id;
  update public.strategy_versions set status = 'published', is_current = true, version_number = greatest(version_number, published_version), published_at = timezone('utc', now()), effective_from = current_date where id = draft_version_id;
  insert into public.audit_logs (actor_user_id, target_user_id, space_id, relationship_id, action, entity_type, entity_id, metadata)
  values (current_user_id, draft.user_id, draft.space_id, draft.relationship_id, 'strategy_published', 'strategy_version', draft_version_id, jsonb_build_object('version_number', draft.version_number));
  return draft_version_id;
end;
$$;

grant execute on function public.publish_coach_strategy(uuid) to authenticated;

commit;

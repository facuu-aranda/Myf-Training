begin;

create or replace function public.save_coach_workout_plan(target_space_id uuid, target_athlete_id uuid, workout_days jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  day_data jsonb;
  exercise_data jsonb;
  new_day_id uuid;
  exercise_id_value uuid;
  day_index integer := 0;
  exercise_index integer;
begin
  if not public.has_coach_permission(target_space_id, target_athlete_id, 'strategy_manage') then raise exception 'Not authorized to manage workout plan'; end if;
  if jsonb_typeof(workout_days) <> 'array' or jsonb_array_length(workout_days) > 14 then raise exception 'Invalid workout plan'; end if;

  for day_data in select value from jsonb_array_elements(workout_days) loop
    if (day_data->>'weekday')::integer < 1 or (day_data->>'weekday')::integer > 7 then raise exception 'Invalid workout weekday'; end if;
    if jsonb_typeof(day_data->'exercises') <> 'array' or jsonb_array_length(day_data->'exercises') > 30 then raise exception 'Invalid workout exercises'; end if;
  end loop;

  update public.workout_days set active = false, updated_at = timezone('utc', now()) where user_id = target_athlete_id and active = true;
  for day_data in select value from jsonb_array_elements(workout_days) loop
    new_day_id := gen_random_uuid();
    insert into public.workout_days (id, user_id, name, name_es, description, weekday, order_index, active, estimated_minutes)
    values (new_day_id, target_athlete_id, coalesce(day_data->>'name', 'Training day'), coalesce(day_data->>'nameEs', day_data->>'name', 'Training day'), coalesce(day_data->>'description', ''), (day_data->>'weekday')::integer, day_index, true, greatest(coalesce((day_data->>'estimatedMinutes')::integer, 45), 1));
    exercise_index := 0;
    for exercise_data in select value from jsonb_array_elements(day_data->'exercises') loop
      exercise_id_value := (exercise_data->>'exerciseId')::uuid;
      if not exists (select 1 from public.exercises where id = exercise_id_value and status = 'active') then raise exception 'Exercise is not available'; end if;
      insert into public.workout_exercises (id, workout_day_id, exercise_id, order_index, sets, target_reps, target_seconds, target_weight, rest_seconds, notes)
      values (gen_random_uuid(), new_day_id, exercise_id_value, exercise_index, greatest(coalesce((exercise_data->>'sets')::integer, 3), 1), greatest(coalesce((exercise_data->>'targetReps')::integer, 10), 0), nullif((exercise_data->>'targetSeconds')::integer, 0), greatest(coalesce((exercise_data->>'targetWeight')::numeric, 0), 0), greatest(coalesce((exercise_data->>'restSeconds')::integer, 60), 0), coalesce(exercise_data->>'notes', ''));
      exercise_index := exercise_index + 1;
    end loop;
    day_index := day_index + 1;
  end loop;

  insert into public.audit_logs (actor_user_id, target_user_id, space_id, action, entity_type, metadata)
  values (auth.uid(), target_athlete_id, target_space_id, 'coach_changed_training', 'workout_plan', jsonb_build_object('days', jsonb_array_length(workout_days)));
  return true;
end;
$$;

grant execute on function public.save_coach_workout_plan(uuid, uuid, jsonb) to authenticated;

commit;

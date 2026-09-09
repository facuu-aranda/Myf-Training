begin;

create or replace function public.get_coach_athlete_strategy(target_space_id uuid, target_athlete_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  nutrition jsonb;
  profile_data jsonb;
  workout_data jsonb;
begin
  if not public.has_coach_permission(target_space_id, target_athlete_id, 'strategy_view') then raise exception 'Not authorized to view athlete Strategy'; end if;
  select to_jsonb(profile) - 'email' - 'username' - 'password_hash' into profile_data from public.profiles profile where profile.id = target_athlete_id;
  select to_jsonb(plan) into nutrition from public.nutrition_plans plan where plan.user_id = target_athlete_id;
  select coalesce(jsonb_agg(to_jsonb(day) || jsonb_build_object('exercises', (select coalesce(jsonb_agg(to_jsonb(exercise) order by exercise.order_index), '[]'::jsonb) from public.workout_exercises exercise where exercise.workout_day_id = day.id)) order by day.order_index), '[]'::jsonb) into workout_data from public.workout_days day where day.user_id = target_athlete_id and day.active = true;
  return jsonb_build_object('profile', profile_data, 'nutrition', nutrition, 'workoutDays', workout_data);
end;
$$;

grant execute on function public.get_coach_athlete_strategy(uuid, uuid) to authenticated;

create or replace function public.update_coach_strategy_goals(target_space_id uuid, target_athlete_id uuid, step_goal integer, calorie_goal integer, protein_goal numeric, carbs_goal numeric, fats_goal numeric, fiber_goal numeric)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_coach_permission(target_space_id, target_athlete_id, 'strategy_manage') then raise exception 'Not authorized to manage athlete Strategy'; end if;
  if step_goal < 0 or calorie_goal <= 0 or protein_goal < 0 or carbs_goal < 0 or fats_goal < 0 or fiber_goal < 0 then raise exception 'Invalid Strategy goals'; end if;
  update public.profiles set daily_step_goal = step_goal, daily_calorie_goal = calorie_goal, updated_at = timezone('utc', now()) where id = target_athlete_id;
  update public.nutrition_plans set calories = calorie_goal, protein = protein_goal, carbs = carbs_goal, fats = fats_goal, fiber = fiber_goal, updated_at = timezone('utc', now()) where user_id = target_athlete_id;
  return found;
end;
$$;

grant execute on function public.update_coach_strategy_goals(uuid, uuid, integer, integer, numeric, numeric, numeric, numeric) to authenticated;

commit;

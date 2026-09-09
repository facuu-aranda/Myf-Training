begin;

create or replace function public.create_ai_planned_meal(input jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  meal_id uuid := gen_random_uuid();
  plan_id uuid;
  plan_day_id uuid;
  target_date date := (input->>'planDate')::date;
  plan_start date;
  plan_end date;
  food_id_value uuid := nullif(input->>'foodId', '')::uuid;
  recipe_id_value uuid := nullif(input->>'recipeId', '')::uuid;
  quantity_value numeric := (input->>'quantity')::numeric;
  unit_value text := coalesce(input->>'unit', 'g');
  meal_type_value text := coalesce(input->>'mealType', 'other');
  household_id_value uuid;
  servings_value numeric;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if target_date is null then raise exception 'Plan date is required'; end if;
  if (food_id_value is null) = (recipe_id_value is null) then raise exception 'Exactly one food or recipe is required'; end if;
  if quantity_value is null or quantity_value <= 0 then raise exception 'Quantity must be greater than zero'; end if;
  if meal_type_value not in ('breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout', 'other') then raise exception 'Invalid meal type'; end if;
  if unit_value not in ('g', 'kg', 'mg', 'ml', 'l', 'unit', 'cup', 'tablespoon', 'teaspoon', 'slice', 'portion', 'piece') then raise exception 'Invalid food unit'; end if;
  if food_id_value is not null and not exists (select 1 from public.foods where id = food_id_value and archived_at is null and (source_type = 'system' or owner_user_id = current_user_id)) then raise exception 'Food is not accessible'; end if;
  if recipe_id_value is not null and not exists (select 1 from public.recipes where id = recipe_id_value and (created_by = current_user_id or visibility = 'system' or (visibility = 'household' and exists (select 1 from public.household_members where household_id = recipes.household_id and user_id = current_user_id and left_at is null)))) then raise exception 'Recipe is not accessible'; end if;
  if recipe_id_value is not null then servings_value := quantity_value; end if;
  select member.household_id into household_id_value from public.household_members member where member.user_id = current_user_id and member.left_at is null order by member.joined_at asc limit 1;

  select id into plan_id from public.meal_plans where user_id = current_user_id and starts_on <= target_date and ends_on >= target_date order by starts_on desc limit 1;
  if plan_id is null then
    plan_start := target_date - (extract(isodow from target_date)::int - 1);
    plan_end := plan_start + 6;
    plan_id := gen_random_uuid();
    insert into public.meal_plans (id, user_id, household_id, name, starts_on, ends_on, visibility)
    values (plan_id, current_user_id, household_id_value, 'Weekly nutrition plan', plan_start, plan_end, 'private');
    insert into public.meal_plan_days (id, meal_plan_id, plan_date)
    select gen_random_uuid(), plan_id, generate_series(plan_start, plan_end);
  end if;
  select id into plan_day_id from public.meal_plan_days where meal_plan_id = plan_id and public.meal_plan_days.plan_date = target_date limit 1;
  if plan_day_id is null then raise exception 'Plan day could not be created'; end if;

  insert into public.planned_meals (id, meal_plan_day_id, meal_type, scheduled_time, food_id, recipe_id, quantity, unit, servings, notes, status)
  values (meal_id, plan_day_id, meal_type_value, nullif(input->>'scheduledTime', '')::time, food_id_value, recipe_id_value, case when food_id_value is not null then quantity_value else null end, case when food_id_value is not null then unit_value else null end, servings_value, coalesce(input->>'notes', ''), 'planned');
  return meal_id;
end;
$$;

revoke all on function public.create_ai_planned_meal(jsonb) from public;
grant execute on function public.create_ai_planned_meal(jsonb) to authenticated;

create or replace function public.create_ai_workout_draft(input jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  workout_day_id uuid := gen_random_uuid();
  workout_name text := btrim(input->>'name');
  weekday_value integer := (input->>'weekday')::integer;
  duration_value integer := coalesce((input->>'estimatedMinutes')::integer, 45);
  exercise_ids jsonb := input->'exerciseIds';
  existing_days integer;
  exercise_value text;
  exercise_index integer := 0;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if workout_name is null or workout_name = '' or length(workout_name) > 160 then raise exception 'Workout name is required'; end if;
  if weekday_value is null or weekday_value < 1 or weekday_value > 7 then raise exception 'Invalid weekday'; end if;
  if duration_value is null or duration_value < 1 or duration_value > 600 then raise exception 'Invalid workout duration'; end if;
  if jsonb_typeof(exercise_ids) <> 'array' or jsonb_array_length(exercise_ids) < 1 or jsonb_array_length(exercise_ids) > 20 then raise exception 'One to twenty exercises are required'; end if;
  if exists (select 1 from jsonb_array_elements_text(exercise_ids) value where not exists (select 1 from public.exercises where id = value)) then raise exception 'Exercise is not available'; end if;
  select count(*) into existing_days from public.workout_days where user_id = current_user_id;
  insert into public.workout_days (id, user_id, name, name_es, description, weekday, order_index, active, estimated_minutes)
  values (workout_day_id, current_user_id, workout_name, workout_name, coalesce(input->>'description', ''), weekday_value, existing_days, true, duration_value);
  for exercise_value in select value from jsonb_array_elements_text(exercise_ids) loop
    insert into public.workout_exercises (id, workout_day_id, exercise_id, order_index, sets, target_reps, target_seconds, target_weight, rest_seconds, notes)
    values (gen_random_uuid(), workout_day_id, exercise_value::uuid, exercise_index, 3, 10, null, 0, 60, '');
    exercise_index := exercise_index + 1;
  end loop;
  return workout_day_id;
end;
$$;

revoke all on function public.create_ai_workout_draft(jsonb) from public;
grant execute on function public.create_ai_workout_draft(jsonb) to authenticated;

commit;

begin;

create or replace function public.update_custom_food(p_food_id uuid, input jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  serving_size numeric := (input->>'servingSize')::numeric;
  serving_unit text := coalesce(input->>'servingUnit', 'g');
  basis text;
  scale numeric;
  calories numeric := nullif(input->>'calories', '')::numeric;
  protein numeric := nullif(input->>'protein', '')::numeric;
  carbs numeric := nullif(input->>'carbs', '')::numeric;
  fat numeric := nullif(input->>'fat', '')::numeric;
  fiber numeric := nullif(input->>'fiber', '')::numeric;
  sugar numeric := nullif(input->>'sugar', '')::numeric;
  sodium numeric := nullif(input->>'sodiumMg', '')::numeric;
  saturated_fat numeric := nullif(input->>'saturatedFat', '')::numeric;
  portion_grams numeric;
  portion_ml numeric;
  food_name text := btrim(input->>'name');
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.foods where id = p_food_id and owner_user_id = current_user_id and source_type = 'user') then raise exception 'Custom food not found'; end if;
  if food_name is null or food_name = '' then raise exception 'Food name is required'; end if;
  if serving_size is null or serving_size <= 0 then raise exception 'Serving size must be greater than zero'; end if;
  if calories is null or calories < 0 then raise exception 'Calories must be non-negative'; end if;
  if serving_unit not in ('g', 'kg', 'mg', 'ml', 'l', 'unit', 'cup', 'tablespoon', 'teaspoon', 'slice', 'portion', 'piece') then raise exception 'Unsupported serving unit'; end if;
  if serving_unit in ('g', 'kg', 'mg') then
    basis := 'per_100g';
    portion_grams := case serving_unit when 'kg' then serving_size * 1000 when 'mg' then serving_size / 1000 else serving_size end;
    scale := 100 / portion_grams;
  elsif serving_unit in ('ml', 'l') then
    basis := 'per_100ml';
    portion_ml := case serving_unit when 'l' then serving_size * 1000 else serving_size end;
    scale := 100 / portion_ml;
  else
    basis := 'per_unit';
    scale := 1;
  end if;

  update public.foods
  set name = food_name, name_es = food_name, name_en = food_name,
      description = coalesce(input->>'notes', ''), category = coalesce(input->>'category', ''),
      brand = nullif(input->>'brand', ''), default_unit = serving_unit,
      metadata = jsonb_build_object('custom_notes', coalesce(input->>'notes', ''))
  where id = p_food_id and owner_user_id = current_user_id and source_type = 'user';

  delete from public.food_nutrients where food_id = p_food_id;
  delete from public.food_portions where food_id = p_food_id;
  insert into public.food_nutrients (food_id, basis, calories, protein_g, carbohydrates_g, fat_g, fiber_g, saturated_fat_g, sugar_g, sodium_mg)
  values (p_food_id, basis, calories * scale, protein * scale, carbs * scale, fat * scale, fiber * scale, saturated_fat * scale, sugar * scale, sodium * scale);
  if portion_grams is not null or portion_ml is not null then
    insert into public.food_portions (food_id, label, unit, grams, ml, is_default)
    values (p_food_id, serving_size || ' ' || serving_unit, serving_unit, portion_grams, portion_ml, true);
  end if;
  return true;
end;
$$;

revoke all on function public.update_custom_food(uuid, jsonb) from public;
grant execute on function public.update_custom_food(uuid, jsonb) to authenticated;

alter table public.foods replica identity full;
do $$
begin
  alter publication supabase_realtime add table public.foods;
exception when duplicate_object then null;
end $$;

create or replace function public.health_check()
returns jsonb
language sql
security definer stable
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'profiles', (select count(*) from public.profiles),
    'couples', (select count(*) from public.couples),
    'households', (select count(*) from public.households),
    'household_members', (select count(*) from public.household_members where left_at is null),
    'foods', (select count(*) from public.foods),
    'food_logs', (select count(*) from public.food_logs),
    'food_log_items', (select count(*) from public.food_log_items),
    'meal_plans', (select count(*) from public.meal_plans),
    'meal_plan_days', (select count(*) from public.meal_plan_days),
    'planned_meals', (select count(*) from public.planned_meals),
    'grocery_lists', (select count(*) from public.grocery_lists),
    'grocery_list_items', (select count(*) from public.grocery_list_items),
    'exercises', (select count(*) from public.exercises),
    'workout_days', (select count(*) from public.workout_days),
    'sessions', (select count(*) from public.workout_sessions),
    'realtime_tables', jsonb_build_array('foods', 'workout_sessions', 'exercise_sets', 'daily_metrics', 'personal_records', 'activity_events', 'food_logs', 'food_log_items', 'meal_plans', 'meal_plan_days', 'planned_meals', 'grocery_lists', 'grocery_list_items', 'households', 'household_members', 'household_invitations', 'profile_follows')
  );
$$;
grant execute on function public.health_check() to authenticated, service_role;

commit;

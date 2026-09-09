begin;

create or replace function public.create_ai_food_log(input jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  food_log_id uuid := gen_random_uuid();
  food_id_value uuid := nullif(input->>'foodId', '')::uuid;
  recipe_id_value uuid := nullif(input->>'recipeId', '')::uuid;
  consumed_on_value date := coalesce(nullif(input->>'consumedOn', '')::date, current_date);
  consumed_at_value timestamptz := coalesce(nullif(input->>'consumedAt', '')::timestamptz, timezone('utc', now()));
  meal_type_value text := coalesce(input->>'mealType', 'other');
  quantity_value numeric := (input->>'quantity')::numeric;
  unit_value text := coalesce(input->>'unit', 'g');
  household_id_value uuid;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if (food_id_value is null) = (recipe_id_value is null) then raise exception 'Exactly one food or recipe is required'; end if;
  if quantity_value is null or quantity_value <= 0 then raise exception 'Quantity must be greater than zero'; end if;
  if meal_type_value not in ('breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout', 'other') then raise exception 'Invalid meal type'; end if;
  if unit_value not in ('g', 'kg', 'mg', 'ml', 'l', 'unit', 'cup', 'tablespoon', 'teaspoon', 'slice', 'portion', 'piece') then raise exception 'Invalid food unit'; end if;

  if food_id_value is not null and not exists (select 1 from public.foods where id = food_id_value and archived_at is null and (source_type = 'system' or owner_user_id = current_user_id)) then raise exception 'Food is not accessible'; end if;
  if recipe_id_value is not null and not exists (select 1 from public.recipes where id = recipe_id_value and (created_by = current_user_id or visibility = 'system' or (visibility = 'household' and exists (select 1 from public.household_members where household_id = recipes.household_id and user_id = current_user_id and left_at is null)))) then raise exception 'Recipe is not accessible'; end if;
  select member.household_id into household_id_value from public.household_members member where member.user_id = current_user_id and member.left_at is null order by member.joined_at asc limit 1;

  insert into public.food_logs (id, user_id, household_id, visibility, consumed_on, consumed_at, meal_type, notes)
  values (food_log_id, current_user_id, household_id_value, 'private', consumed_on_value, consumed_at_value, meal_type_value, coalesce(input->>'notes', ''));
  insert into public.food_log_items (food_log_id, food_id, recipe_id, quantity, unit, normalized_grams, normalized_ml, precision, notes)
  values (food_log_id, food_id_value, recipe_id_value, quantity_value, unit_value, null, null, 'exact', '');
  return food_log_id;
end;
$$;

revoke all on function public.create_ai_food_log(jsonb) from public;
grant execute on function public.create_ai_food_log(jsonb) to authenticated;

commit;

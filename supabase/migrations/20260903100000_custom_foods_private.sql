begin;

alter table public.foods
  add column if not exists owner_user_id uuid references auth.users(id) on delete cascade,
  add column if not exists source_type text not null default 'system',
  add column if not exists archived_at timestamptz;

alter table public.foods
  drop constraint if exists foods_source_type_owner_check;
alter table public.foods
  add constraint foods_source_type_owner_check
  check ((source_type = 'system' and owner_user_id is null) or (source_type = 'user' and owner_user_id is not null));

create index if not exists foods_owner_created_idx
  on public.foods(owner_user_id, created_at desc)
  where owner_user_id is not null;
create index if not exists foods_owner_name_idx
  on public.foods(owner_user_id, name);

insert into public.food_sources (source_key, name, source_url, license, attribution)
values ('user-custom', 'My foods', '', 'User-created', 'Created by the Train Together user')
on conflict (source_key) do nothing;

alter table public.food_nutrients enable row level security;
alter table public.food_portions enable row level security;
alter table public.food_aliases enable row level security;

 drop policy if exists foods_select_authenticated on public.foods;
create policy foods_select_visible on public.foods for select using (
  (source_type = 'system' and archived_at is null) or owner_user_id = auth.uid()
);
drop policy if exists foods_insert_custom on public.foods;
create policy foods_insert_custom on public.foods for insert with check (
  source_type = 'user' and owner_user_id = auth.uid()
);
drop policy if exists foods_update_custom on public.foods;
create policy foods_update_custom on public.foods for update using (owner_user_id = auth.uid()) with check (
  source_type = 'user' and owner_user_id = auth.uid()
);
drop policy if exists foods_delete_custom on public.foods;
create policy foods_delete_custom on public.foods for delete using (owner_user_id = auth.uid());

drop policy if exists food_nutrients_select_authenticated on public.food_nutrients;
create policy food_nutrients_select_visible on public.food_nutrients for select using (
  exists (select 1 from public.foods f where f.id = food_nutrients.food_id and ((f.source_type = 'system' and f.archived_at is null) or f.owner_user_id = auth.uid()))
);
drop policy if exists food_portions_select_authenticated on public.food_portions;
create policy food_portions_select_visible on public.food_portions for select using (
  exists (select 1 from public.foods f where f.id = food_portions.food_id and ((f.source_type = 'system' and f.archived_at is null) or f.owner_user_id = auth.uid()))
);
drop policy if exists food_aliases_select_authenticated on public.food_aliases;
create policy food_aliases_select_visible on public.food_aliases for select using (
  exists (select 1 from public.foods f where f.id = food_aliases.food_id and ((f.source_type = 'system' and f.archived_at is null) or f.owner_user_id = auth.uid()))
);

create or replace function public.create_custom_food(input jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  custom_source_id uuid;
  new_food_id uuid := gen_random_uuid();
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

  select id into custom_source_id from public.food_sources where source_key = 'user-custom';
  insert into public.foods (id, source_id, external_id, name, name_es, name_en, description, category, subcategory, food_group, brand, default_unit, is_basic_food, is_packaged, metadata, owner_user_id, source_type)
  values (new_food_id, custom_source_id, 'custom:' || new_food_id, food_name, food_name, food_name, coalesce(input->>'notes', ''), coalesce(input->>'category', ''), '', 'custom', nullif(input->>'brand', ''), serving_unit, false, false, jsonb_build_object('custom_notes', coalesce(input->>'notes', '')), current_user_id, 'user');

  insert into public.food_nutrients (food_id, basis, calories, protein_g, carbohydrates_g, fat_g, fiber_g, saturated_fat_g, sugar_g, sodium_mg)
  values (new_food_id, basis, calories * scale, protein * scale, carbs * scale, fat * scale, fiber * scale, saturated_fat * scale, sugar * scale, sodium * scale);

  if portion_grams is not null or portion_ml is not null then
    insert into public.food_portions (food_id, label, unit, grams, ml, is_default)
    values (new_food_id, serving_size || ' ' || serving_unit, serving_unit, portion_grams, portion_ml, true);
  end if;
  return new_food_id;
end;
$$;

revoke all on function public.create_custom_food(jsonb) from public;
grant execute on function public.create_custom_food(jsonb) to authenticated;

create or replace function public.archive_custom_food(p_food_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.foods set archived_at = timezone('utc', now()) where id = p_food_id and owner_user_id = auth.uid() and source_type = 'user';
  return found;
end;
$$;

revoke all on function public.archive_custom_food(uuid) from public;
grant execute on function public.archive_custom_food(uuid) to authenticated;

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

drop function if exists public.search_foods_ranked(text, int, int);
create or replace function public.search_foods_ranked(search_term text, limit_count int, offset_count int, scope_filter text default 'all')
returns setof public.foods
language sql
stable
as $$
  select f.*
  from public.foods f
  where f.archived_at is null
    and ((f.source_type = 'system') or f.owner_user_id = auth.uid())
    and (scope_filter = 'all' or (scope_filter = 'global' and f.source_type = 'system') or (scope_filter = 'mine' and f.owner_user_id = auth.uid()))
    and (nullif(trim(search_term), '') is null or f.name ilike '%' || trim(search_term) || '%' or f.name_es ilike '%' || trim(search_term) || '%' or f.name_en ilike '%' || trim(search_term) || '%' or f.description ilike '%' || trim(search_term) || '%' or f.category ilike '%' || trim(search_term) || '%')
  order by
    case when f.owner_user_id = auth.uid() and nullif(trim(search_term), '') is not null and lower(f.name) = lower(trim(search_term)) then 0 else 1 end,
    case when f.owner_user_id = auth.uid() and nullif(trim(search_term), '') is not null and lower(f.name) like lower(trim(search_term)) || '%' then 0 else 1 end,
    case when f.source_type = 'user' then 0 else 1 end,
    f.is_basic_food desc,
    char_length(f.name_es),
    f.name_es
  limit greatest(1, least(limit_count, 100)) offset greatest(offset_count, 0);
$$;

grant execute on function public.search_foods_ranked(text, int, int, text) to authenticated;

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

alter table public.foods replica identity full;
do $$
begin
  alter publication supabase_realtime add table public.foods;
exception when duplicate_object then null;
end $$;

commit;

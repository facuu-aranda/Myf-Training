create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  couple_id uuid references public.couples(id) on delete cascade,
  name text not null default 'Weekly nutrition plan',
  starts_on date not null,
  ends_on date not null,
  visibility text not null default 'private' check (visibility in ('private', 'household')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (ends_on >= starts_on),
  check (visibility = 'private' or couple_id is not null),
  unique (user_id, starts_on, ends_on)
);

create table if not exists public.meal_plan_days (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  plan_date date not null,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (meal_plan_id, plan_date)
);

create table if not exists public.planned_meals (
  id uuid primary key default gen_random_uuid(),
  meal_plan_day_id uuid not null references public.meal_plan_days(id) on delete cascade,
  meal_type text not null default 'other' check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout', 'other')),
  scheduled_time time,
  food_id uuid references public.foods(id) on delete restrict,
  recipe_id uuid references public.recipes(id) on delete restrict,
  quantity numeric(10, 3) check (quantity is null or quantity > 0),
  unit text check (unit is null or unit in ('g', 'kg', 'mg', 'ml', 'l', 'unit', 'cup', 'tablespoon', 'teaspoon', 'slice', 'portion', 'piece')),
  servings numeric(8, 2) check (servings is null or servings > 0),
  planned_calories numeric(10, 2) check (planned_calories is null or planned_calories >= 0),
  planned_protein_g numeric(10, 2) check (planned_protein_g is null or planned_protein_g >= 0),
  planned_carbohydrates_g numeric(10, 2) check (planned_carbohydrates_g is null or planned_carbohydrates_g >= 0),
  planned_fat_g numeric(10, 2) check (planned_fat_g is null or planned_fat_g >= 0),
  planned_fiber_g numeric(10, 2) check (planned_fiber_g is null or planned_fiber_g >= 0),
  notes text not null default '',
  status text not null default 'planned' check (status in ('planned', 'completed', 'logged')),
  completed_at timestamptz,
  logged_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (not (food_id is not null and recipe_id is not null)),
  check (food_id is not null or recipe_id is not null or planned_calories is not null),
  check (food_id is null or (quantity is not null and unit is not null)),
  check (recipe_id is null or servings is not null)
);

create index if not exists meal_plans_user_date_idx on public.meal_plans(user_id, starts_on desc);
create index if not exists meal_plans_couple_idx on public.meal_plans(couple_id, starts_on desc);
create index if not exists meal_plan_days_plan_date_idx on public.meal_plan_days(meal_plan_id, plan_date);
create index if not exists planned_meals_day_time_idx on public.planned_meals(meal_plan_day_id, scheduled_time, meal_type);
create index if not exists planned_meals_food_idx on public.planned_meals(food_id);
create index if not exists planned_meals_recipe_idx on public.planned_meals(recipe_id);

drop trigger if exists meal_plans_set_updated_at on public.meal_plans;
create trigger meal_plans_set_updated_at before update on public.meal_plans for each row execute function public.set_updated_at();
drop trigger if exists meal_plan_days_set_updated_at on public.meal_plan_days;
create trigger meal_plan_days_set_updated_at before update on public.meal_plan_days for each row execute function public.set_updated_at();
drop trigger if exists planned_meals_set_updated_at on public.planned_meals;
create trigger planned_meals_set_updated_at before update on public.planned_meals for each row execute function public.set_updated_at();

alter table public.meal_plans enable row level security;
alter table public.meal_plan_days enable row level security;
alter table public.planned_meals enable row level security;

drop policy if exists meal_plans_select_visible on public.meal_plans;
create policy meal_plans_select_visible on public.meal_plans for select using (
  user_id = auth.uid()
  or (visibility = 'household' and exists (select 1 from public.couple_members where couple_id = meal_plans.couple_id and user_id = auth.uid()))
);
drop policy if exists meal_plans_insert_own on public.meal_plans;
create policy meal_plans_insert_own on public.meal_plans for insert with check (
  user_id = auth.uid()
  and (visibility = 'private' or exists (select 1 from public.couple_members where couple_id = meal_plans.couple_id and user_id = auth.uid()))
);
drop policy if exists meal_plans_update_own on public.meal_plans;
create policy meal_plans_update_own on public.meal_plans for update using (user_id = auth.uid()) with check (
  user_id = auth.uid()
  and (visibility = 'private' or exists (select 1 from public.couple_members where couple_id = meal_plans.couple_id and user_id = auth.uid()))
);
drop policy if exists meal_plans_delete_own on public.meal_plans;
create policy meal_plans_delete_own on public.meal_plans for delete using (user_id = auth.uid());

drop policy if exists meal_plan_days_select_visible on public.meal_plan_days;
create policy meal_plan_days_select_visible on public.meal_plan_days for select using (exists (select 1 from public.meal_plans where id = meal_plan_days.meal_plan_id));
drop policy if exists meal_plan_days_insert_own on public.meal_plan_days;
create policy meal_plan_days_insert_own on public.meal_plan_days for insert with check (exists (select 1 from public.meal_plans where id = meal_plan_days.meal_plan_id and user_id = auth.uid()));
drop policy if exists meal_plan_days_update_own on public.meal_plan_days;
create policy meal_plan_days_update_own on public.meal_plan_days for update using (exists (select 1 from public.meal_plans where id = meal_plan_days.meal_plan_id and user_id = auth.uid())) with check (exists (select 1 from public.meal_plans where id = meal_plan_days.meal_plan_id and user_id = auth.uid()));
drop policy if exists meal_plan_days_delete_own on public.meal_plan_days;
create policy meal_plan_days_delete_own on public.meal_plan_days for delete using (exists (select 1 from public.meal_plans where id = meal_plan_days.meal_plan_id and user_id = auth.uid()));

drop policy if exists planned_meals_select_visible on public.planned_meals;
create policy planned_meals_select_visible on public.planned_meals for select using (exists (select 1 from public.meal_plan_days where id = planned_meals.meal_plan_day_id));
drop policy if exists planned_meals_insert_own on public.planned_meals;
create policy planned_meals_insert_own on public.planned_meals for insert with check (exists (select 1 from public.meal_plan_days day join public.meal_plans plan on plan.id = day.meal_plan_id where day.id = planned_meals.meal_plan_day_id and plan.user_id = auth.uid()));
drop policy if exists planned_meals_update_own on public.planned_meals;
create policy planned_meals_update_own on public.planned_meals for update using (exists (select 1 from public.meal_plan_days day join public.meal_plans plan on plan.id = day.meal_plan_id where day.id = planned_meals.meal_plan_day_id and plan.user_id = auth.uid())) with check (exists (select 1 from public.meal_plan_days day join public.meal_plans plan on plan.id = day.meal_plan_id where day.id = planned_meals.meal_plan_day_id and plan.user_id = auth.uid()));
drop policy if exists planned_meals_delete_own on public.planned_meals;
create policy planned_meals_delete_own on public.planned_meals for delete using (exists (select 1 from public.meal_plan_days day join public.meal_plans plan on plan.id = day.meal_plan_id where day.id = planned_meals.meal_plan_day_id and plan.user_id = auth.uid()));

create or replace function public.health_check()
returns jsonb
language sql
security definer stable
set search_path = public
as $$
  select jsonb_build_object(
    'profiles', (select count(*) from public.profiles),
    'couples', (select count(*) from public.couples),
    'foods', (select count(*) from public.foods),
    'food_logs', (select count(*) from public.food_logs),
    'food_log_items', (select count(*) from public.food_log_items),
    'meal_plans', (select count(*) from public.meal_plans),
    'meal_plan_days', (select count(*) from public.meal_plan_days),
    'planned_meals', (select count(*) from public.planned_meals),
    'exercises', (select count(*) from public.exercises),
    'workout_days', (select count(*) from public.workout_days),
    'sessions', (select count(*) from public.workout_sessions),
    'realtime_tables', jsonb_build_array('workout_sessions', 'exercise_sets', 'daily_metrics', 'personal_records', 'activity_events', 'food_logs', 'food_log_items', 'meal_plans', 'meal_plan_days', 'planned_meals')
  );
$$;
grant execute on function public.health_check() to authenticated, service_role;

alter table public.meal_plans replica identity full;
alter table public.meal_plan_days replica identity full;
alter table public.planned_meals replica identity full;
do $$
begin
  alter publication supabase_realtime add table public.meal_plans;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.meal_plan_days;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.planned_meals;
exception when duplicate_object then null;
end $$;

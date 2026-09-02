create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consumed_on date not null default current_date,
  consumed_at timestamptz not null default timezone('utc', now()),
  meal_type text not null default 'other' check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout', 'other')),
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.food_log_items (
  id uuid primary key default gen_random_uuid(),
  food_log_id uuid not null references public.food_logs(id) on delete cascade,
  food_id uuid references public.foods(id) on delete restrict,
  recipe_id uuid references public.recipes(id) on delete restrict,
  food_portion_id uuid references public.food_portions(id) on delete set null,
  quantity numeric(10, 3) not null check (quantity > 0),
  unit text not null check (unit in ('g', 'kg', 'mg', 'ml', 'l', 'unit', 'cup', 'tablespoon', 'teaspoon', 'slice', 'portion', 'piece')),
  normalized_grams numeric(12, 3) check (normalized_grams is null or normalized_grams > 0),
  normalized_ml numeric(12, 3) check (normalized_ml is null or normalized_ml > 0),
  precision text not null default 'exact' check (precision in ('exact', 'estimated', 'portion')),
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check ((food_id is not null) <> (recipe_id is not null))
);

create index if not exists food_logs_user_date_idx on public.food_logs(user_id, consumed_on desc, consumed_at desc);
create index if not exists food_log_items_log_idx on public.food_log_items(food_log_id, created_at);
create index if not exists food_log_items_food_idx on public.food_log_items(food_id);
create index if not exists food_log_items_recipe_idx on public.food_log_items(recipe_id);

drop trigger if exists food_logs_set_updated_at on public.food_logs;
create trigger food_logs_set_updated_at before update on public.food_logs for each row execute function public.set_updated_at();
drop trigger if exists food_log_items_set_updated_at on public.food_log_items;
create trigger food_log_items_set_updated_at before update on public.food_log_items for each row execute function public.set_updated_at();

alter table public.food_logs enable row level security;
alter table public.food_log_items enable row level security;

drop policy if exists food_logs_own on public.food_logs;
create policy food_logs_own on public.food_logs for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists food_log_items_own on public.food_log_items;
create policy food_log_items_own on public.food_log_items for all using (exists (select 1 from public.food_logs where id = food_log_items.food_log_id and user_id = auth.uid())) with check (exists (select 1 from public.food_logs where id = food_log_items.food_log_id and user_id = auth.uid()));

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
    'exercises', (select count(*) from public.exercises),
    'workout_days', (select count(*) from public.workout_days),
    'sessions', (select count(*) from public.workout_sessions),
    'realtime_tables', jsonb_build_array('workout_sessions', 'exercise_sets', 'daily_metrics', 'personal_records', 'activity_events', 'food_logs', 'food_log_items')
  );
$$;
grant execute on function public.health_check() to authenticated, service_role;

alter table public.food_logs replica identity full;
alter table public.food_log_items replica identity full;
do $$
begin
  alter publication supabase_realtime add table public.food_logs;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.food_log_items;
exception when duplicate_object then null;
end $$;

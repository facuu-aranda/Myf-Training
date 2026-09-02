create table if not exists public.grocery_lists (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  starts_on date not null,
  ends_on date not null,
  status text not null default 'current' check (status in ('current', 'completed', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (ends_on >= starts_on),
  unique (couple_id, starts_on, ends_on)
);

create table if not exists public.grocery_list_items (
  id uuid primary key default gen_random_uuid(),
  grocery_list_id uuid not null references public.grocery_lists(id) on delete cascade,
  food_id uuid references public.foods(id) on delete restrict,
  name text not null,
  name_es text not null default '',
  name_en text not null default '',
  category text not null default 'other' check (category in ('produce', 'protein', 'dairy', 'grains', 'pantry', 'frozen', 'beverages', 'snacks', 'other')),
  source text not null default 'manual' check (source in ('planned', 'manual', 'recipe-derived')),
  calculated_quantity numeric(12, 3) check (calculated_quantity is null or calculated_quantity >= 0),
  calculated_unit text check (calculated_unit is null or calculated_unit in ('g', 'kg', 'ml', 'l', 'unit', 'dozen')),
  manual_quantity numeric(12, 3) check (manual_quantity is null or manual_quantity > 0),
  manual_unit text check (manual_unit is null or manual_unit in ('g', 'kg', 'ml', 'l', 'unit', 'dozen')),
  suggested_quantity numeric(12, 3) check (suggested_quantity is null or suggested_quantity > 0),
  suggested_unit text check (suggested_unit is null or suggested_unit in ('g', 'kg', 'ml', 'l', 'unit', 'dozen')),
  status text not null default 'pending' check (status in ('pending', 'purchased')),
  notes text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (food_id is not null or source = 'manual'),
  check (calculated_quantity is not null or manual_quantity is not null)
);

create index if not exists grocery_lists_couple_date_idx on public.grocery_lists(couple_id, starts_on desc, ends_on desc);
create index if not exists grocery_items_list_category_idx on public.grocery_list_items(grocery_list_id, category, status);
create index if not exists grocery_items_food_idx on public.grocery_list_items(food_id);

drop trigger if exists grocery_lists_set_updated_at on public.grocery_lists;
create trigger grocery_lists_set_updated_at before update on public.grocery_lists for each row execute function public.set_updated_at();
drop trigger if exists grocery_list_items_set_updated_at on public.grocery_list_items;
create trigger grocery_list_items_set_updated_at before update on public.grocery_list_items for each row execute function public.set_updated_at();

alter table public.grocery_lists enable row level security;
alter table public.grocery_list_items enable row level security;

drop policy if exists grocery_lists_household_select on public.grocery_lists;
create policy grocery_lists_household_select on public.grocery_lists for select using (exists (select 1 from public.couple_members where couple_id = grocery_lists.couple_id and user_id = auth.uid()));
drop policy if exists grocery_lists_household_insert on public.grocery_lists;
create policy grocery_lists_household_insert on public.grocery_lists for insert with check (created_by = auth.uid() and exists (select 1 from public.couple_members where couple_id = grocery_lists.couple_id and user_id = auth.uid()));
drop policy if exists grocery_lists_household_update on public.grocery_lists;
create policy grocery_lists_household_update on public.grocery_lists for update using (exists (select 1 from public.couple_members where couple_id = grocery_lists.couple_id and user_id = auth.uid())) with check (exists (select 1 from public.couple_members where couple_id = grocery_lists.couple_id and user_id = auth.uid()));
drop policy if exists grocery_lists_household_delete on public.grocery_lists;
create policy grocery_lists_household_delete on public.grocery_lists for delete using (created_by = auth.uid());

drop policy if exists grocery_list_items_household_select on public.grocery_list_items;
create policy grocery_list_items_household_select on public.grocery_list_items for select using (exists (select 1 from public.grocery_lists where id = grocery_list_items.grocery_list_id and exists (select 1 from public.couple_members where couple_id = grocery_lists.couple_id and user_id = auth.uid())));
drop policy if exists grocery_list_items_household_insert on public.grocery_list_items;
create policy grocery_list_items_household_insert on public.grocery_list_items for insert with check (exists (select 1 from public.grocery_lists where id = grocery_list_items.grocery_list_id and exists (select 1 from public.couple_members where couple_id = grocery_lists.couple_id and user_id = auth.uid())));
drop policy if exists grocery_list_items_household_update on public.grocery_list_items;
create policy grocery_list_items_household_update on public.grocery_list_items for update using (exists (select 1 from public.grocery_lists where id = grocery_list_items.grocery_list_id and exists (select 1 from public.couple_members where couple_id = grocery_lists.couple_id and user_id = auth.uid()))) with check (exists (select 1 from public.grocery_lists where id = grocery_list_items.grocery_list_id and exists (select 1 from public.couple_members where couple_id = grocery_lists.couple_id and user_id = auth.uid())));
drop policy if exists grocery_list_items_household_delete on public.grocery_list_items;
create policy grocery_list_items_household_delete on public.grocery_list_items for delete using (exists (select 1 from public.grocery_lists where id = grocery_list_items.grocery_list_id and exists (select 1 from public.couple_members where couple_id = grocery_lists.couple_id and user_id = auth.uid())));

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
    'grocery_lists', (select count(*) from public.grocery_lists),
    'grocery_list_items', (select count(*) from public.grocery_list_items),
    'exercises', (select count(*) from public.exercises),
    'workout_days', (select count(*) from public.workout_days),
    'sessions', (select count(*) from public.workout_sessions),
    'realtime_tables', jsonb_build_array('workout_sessions', 'exercise_sets', 'daily_metrics', 'personal_records', 'activity_events', 'food_logs', 'food_log_items', 'meal_plans', 'meal_plan_days', 'planned_meals', 'grocery_lists', 'grocery_list_items')
  );
$$;
grant execute on function public.health_check() to authenticated, service_role;

alter table public.grocery_lists replica identity full;
alter table public.grocery_list_items replica identity full;
do $$
begin
  alter publication supabase_realtime add table public.grocery_lists;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.grocery_list_items;
exception when duplicate_object then null;
end $$;

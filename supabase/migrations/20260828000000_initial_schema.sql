create extension if not exists pgcrypto;

create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Train Together',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username = lower(username)),
  display_name text not null,
  first_name text not null,
  avatar_url text,
  height_cm numeric(5, 1) check (height_cm > 0),
  weight_kg numeric(5, 1) check (weight_kg > 0),
  daily_step_goal integer not null default 10000 check (daily_step_goal > 0),
  daily_calorie_goal integer not null default 2000 check (daily_calorie_goal > 0),
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.couple_members (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (couple_id, user_id),
  unique (user_id)
);

create table if not exists public.nutrition_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  calories integer not null default 2000 check (calories > 0),
  protein numeric(6, 1) not null default 0 check (protein >= 0),
  carbs numeric(6, 1) not null default 0 check (carbs >= 0),
  fats numeric(6, 1) not null default 0 check (fats >= 0),
  fiber numeric(6, 1) not null default 0 check (fiber >= 0),
  notes text not null default '',
  starts_on date not null default current_date,
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id)
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  name text not null,
  name_es text not null default '',
  description text not null default '',
  instructions jsonb not null default '[]'::jsonb,
  muscle_group text not null default '',
  target text not null default '',
  category text not null default '',
  equipment text not null default '',
  video_url text,
  thumbnail_url text,
  image_url text,
  source text not null default 'exercises-dataset',
  source_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workout_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  name_es text not null default '',
  description text not null default '',
  weekday smallint not null check (weekday between 1 and 7),
  order_index integer not null default 0,
  active boolean not null default true,
  estimated_minutes integer not null default 45 check (estimated_minutes > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_day_id uuid not null references public.workout_days(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  order_index integer not null default 0,
  sets integer not null default 3 check (sets > 0),
  target_reps integer not null default 10 check (target_reps >= 0),
  target_seconds integer check (target_seconds is null or target_seconds > 0),
  target_weight numeric(7, 2) not null default 0 check (target_weight >= 0),
  rest_seconds integer not null default 60 check (rest_seconds >= 0),
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workout_day_id uuid references public.workout_days(id) on delete set null,
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  overall_feeling smallint not null default 3 check (overall_feeling between 1 and 5),
  energy smallint not null default 3 check (energy between 1 and 5),
  fatigue smallint not null default 3 check (fatigue between 1 and 5),
  mood smallint not null default 3 check (mood between 1 and 5),
  difficulty smallint not null default 5 check (difficulty between 1 and 10),
  notes text not null default '',
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.exercise_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  set_number integer not null check (set_number > 0),
  planned_weight numeric(7, 2) not null default 0 check (planned_weight >= 0),
  actual_weight numeric(7, 2) not null default 0 check (actual_weight >= 0),
  planned_reps integer not null default 0 check (planned_reps >= 0),
  actual_reps integer not null default 0 check (actual_reps >= 0),
  difficulty smallint not null default 5 check (difficulty between 1 and 10),
  feeling smallint not null default 3 check (feeling between 1 and 5),
  pain_level smallint not null default 0 check (pain_level between 0 and 10),
  rest_seconds integer not null default 0 check (rest_seconds >= 0),
  notes text not null default '',
  completed_at timestamptz not null default timezone('utc', now()),
  unique (session_id, exercise_id, set_number)
);

create table if not exists public.daily_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  steps integer not null default 0 check (steps >= 0),
  calories integer not null default 0 check (calories >= 0),
  body_weight numeric(7, 2) check (body_weight is null or body_weight > 0),
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, date)
);

create table if not exists public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null,
  record_type text not null check (record_type in ('weight', 'reps', 'volume', 'streak', 'steps')),
  value numeric(10, 2) not null check (value >= 0),
  unit text not null,
  achieved_at timestamptz not null default timezone('utc', now()),
  label text not null default '',
  unique (user_id, exercise_id, record_type)
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in ('workout_completed', 'step_goal_reached', 'personal_record', 'workout_started', 'metric_updated')),
  title text not null,
  description text not null default '',
  entity_type text not null default '',
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.strategy_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'Strategy',
  starts_on date not null default current_date,
  ends_on date,
  is_current boolean not null default true,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists workout_days_user_idx on public.workout_days(user_id, order_index);
create index if not exists workout_exercises_day_idx on public.workout_exercises(workout_day_id, order_index);
create index if not exists workout_sessions_user_date_idx on public.workout_sessions(user_id, started_at desc);
create index if not exists exercise_sets_session_idx on public.exercise_sets(session_id, exercise_id, set_number);
create index if not exists daily_metrics_user_date_idx on public.daily_metrics(user_id, date desc);
create index if not exists activity_events_created_idx on public.activity_events(created_at desc);
create index if not exists exercises_search_idx on public.exercises using gin (to_tsvector('simple', name || ' ' || name_es || ' ' || muscle_group || ' ' || equipment));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists nutrition_plans_set_updated_at on public.nutrition_plans;
create trigger nutrition_plans_set_updated_at before update on public.nutrition_plans for each row execute function public.set_updated_at();
drop trigger if exists exercises_set_updated_at on public.exercises;
create trigger exercises_set_updated_at before update on public.exercises for each row execute function public.set_updated_at();
drop trigger if exists workout_days_set_updated_at on public.workout_days;
create trigger workout_days_set_updated_at before update on public.workout_days for each row execute function public.set_updated_at();
drop trigger if exists workout_exercises_set_updated_at on public.workout_exercises;
create trigger workout_exercises_set_updated_at before update on public.workout_exercises for each row execute function public.set_updated_at();
drop trigger if exists workout_sessions_set_updated_at on public.workout_sessions;
create trigger workout_sessions_set_updated_at before update on public.workout_sessions for each row execute function public.set_updated_at();
drop trigger if exists daily_metrics_set_updated_at on public.daily_metrics;
create trigger daily_metrics_set_updated_at before update on public.daily_metrics for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, first_name)
  values (
    new.id,
    lower(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'first_name', split_part(new.email, '@', 1))
  ) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_couple_member(target_user_id uuid)
returns boolean
language sql
security definer stable set search_path = public
as $$
  select exists (
    select 1
    from public.couple_members mine
    join public.couple_members target on target.couple_id = mine.couple_id
    where mine.user_id = auth.uid() and target.user_id = target_user_id
  );
$$;

create or replace function public.record_completed_workout_activity()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  day_name text;
  owner_name text;
  volume numeric;
begin
  if new.status = 'completed' and (old.status is distinct from 'completed') then
    select coalesce(wd.name, 'Workout') into day_name from public.workout_days wd where wd.id = new.workout_day_id;
    select coalesce(p.first_name, 'Athlete') into owner_name from public.profiles p where p.id = new.user_id;
    select coalesce(sum(es.actual_weight * es.actual_reps), 0) into volume from public.exercise_sets es where es.session_id = new.id;
    insert into public.activity_events (user_id, event_type, title, description, entity_type, entity_id, metadata)
    values (new.user_id, 'workout_completed', owner_name || ' completed ' || day_name, round(volume)::text || ' kg volume', 'workout_session', new.id, jsonb_build_object('volume', volume));
  end if;
  return new;
end;
$$;

drop trigger if exists workout_completed_activity on public.workout_sessions;
create trigger workout_completed_activity after update on public.workout_sessions for each row execute function public.record_completed_workout_activity();

create or replace function public.record_step_goal_activity()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  goal integer;
  owner_name text;
begin
  select p.daily_step_goal, p.first_name into goal, owner_name from public.profiles p where p.id = new.user_id;
  if new.steps >= coalesce(goal, 10000) and (tg_op = 'INSERT' or coalesce(old.steps, 0) < coalesce(goal, 10000)) then
    insert into public.activity_events (user_id, event_type, title, description, entity_type, entity_id, metadata)
    values (new.user_id, 'step_goal_reached', owner_name || ' reached their step goal', new.steps::text || ' steps', 'daily_metric', new.id, jsonb_build_object('steps', new.steps, 'date', new.date));
  end if;
  return new;
end;
$$;

drop trigger if exists daily_metric_goal_activity on public.daily_metrics;
create trigger daily_metric_goal_activity after insert or update on public.daily_metrics for each row execute function public.record_step_goal_activity();

create or replace function public.update_weight_record()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  owner_id uuid;
  exercise_name text;
begin
  select ws.user_id into owner_id from public.workout_sessions ws where ws.id = new.session_id;
  if new.actual_weight > 0 and new.actual_weight >= coalesce((select max(es.actual_weight) from public.exercise_sets es join public.workout_sessions ws2 on ws2.id = es.session_id where ws2.user_id = owner_id and es.exercise_id = new.exercise_id and es.id <> new.id), 0) then
    select e.name into exercise_name from public.exercises e where e.id = new.exercise_id;
    insert into public.personal_records (user_id, exercise_id, record_type, value, unit, achieved_at, label)
    values (owner_id, new.exercise_id, 'weight', new.actual_weight, 'kg', new.completed_at, coalesce(exercise_name, 'Exercise') || ' · max weight')
    on conflict (user_id, exercise_id, record_type) do update set value = excluded.value, achieved_at = excluded.achieved_at, label = excluded.label
      where public.personal_records.value < excluded.value;
  end if;
  return new;
end;
$$;

drop trigger if exists exercise_set_personal_record on public.exercise_sets;
create trigger exercise_set_personal_record after insert on public.exercise_sets for each row execute function public.update_weight_record();

create or replace function public.health_check()
returns jsonb
language sql
security definer stable set search_path = public
as $$
  select jsonb_build_object(
    'profiles', (select count(*) from public.profiles),
    'couples', (select count(*) from public.couples),
    'exercises', (select count(*) from public.exercises),
    'workout_days', (select count(*) from public.workout_days),
    'sessions', (select count(*) from public.workout_sessions),
    'realtime_tables', jsonb_build_array('workout_sessions', 'exercise_sets', 'daily_metrics', 'personal_records', 'activity_events')
  );
$$;

grant execute on function public.health_check() to authenticated, service_role;
grant execute on function public.is_couple_member(uuid) to authenticated;

alter table public.couples enable row level security;
alter table public.profiles enable row level security;
alter table public.couple_members enable row level security;
alter table public.nutrition_plans enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_days enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.exercise_sets enable row level security;
alter table public.daily_metrics enable row level security;
alter table public.personal_records enable row level security;
alter table public.activity_events enable row level security;
alter table public.strategy_versions enable row level security;

drop policy if exists couples_select on public.couples;
create policy couples_select on public.couples for select using (exists (select 1 from public.couple_members where couple_id = couples.id and user_id = auth.uid()));
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (id = auth.uid() or public.is_couple_member(id));
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists couple_members_select on public.couple_members;
create policy couple_members_select on public.couple_members for select using (user_id = auth.uid() or public.is_couple_member(user_id));

drop policy if exists nutrition_plans_own on public.nutrition_plans;
create policy nutrition_plans_own on public.nutrition_plans for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists exercises_authenticated_select on public.exercises;
create policy exercises_authenticated_select on public.exercises for select using (auth.role() = 'authenticated');
drop policy if exists workout_days_own on public.workout_days;
create policy workout_days_own on public.workout_days for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists workout_exercises_own on public.workout_exercises;
create policy workout_exercises_own on public.workout_exercises for all using (exists (select 1 from public.workout_days where id = workout_exercises.workout_day_id and user_id = auth.uid())) with check (exists (select 1 from public.workout_days where id = workout_exercises.workout_day_id and user_id = auth.uid()));
drop policy if exists workout_sessions_select_shared on public.workout_sessions;
create policy workout_sessions_select_shared on public.workout_sessions for select using (user_id = auth.uid() or public.is_couple_member(user_id));
drop policy if exists workout_sessions_write_own on public.workout_sessions;
create policy workout_sessions_write_own on public.workout_sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists exercise_sets_select_shared on public.exercise_sets;
create policy exercise_sets_select_shared on public.exercise_sets for select using (exists (select 1 from public.workout_sessions where id = exercise_sets.session_id and (user_id = auth.uid() or public.is_couple_member(user_id))));
drop policy if exists exercise_sets_write_own on public.exercise_sets;
create policy exercise_sets_write_own on public.exercise_sets for all using (exists (select 1 from public.workout_sessions where id = exercise_sets.session_id and user_id = auth.uid())) with check (exists (select 1 from public.workout_sessions where id = exercise_sets.session_id and user_id = auth.uid()));
drop policy if exists daily_metrics_select_shared on public.daily_metrics;
create policy daily_metrics_select_shared on public.daily_metrics for select using (user_id = auth.uid() or public.is_couple_member(user_id));
drop policy if exists daily_metrics_write_own on public.daily_metrics;
create policy daily_metrics_write_own on public.daily_metrics for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists personal_records_select_shared on public.personal_records;
create policy personal_records_select_shared on public.personal_records for select using (user_id = auth.uid() or public.is_couple_member(user_id));
drop policy if exists personal_records_write_own on public.personal_records;
create policy personal_records_write_own on public.personal_records for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists activity_events_select_shared on public.activity_events;
create policy activity_events_select_shared on public.activity_events for select using (user_id = auth.uid() or public.is_couple_member(user_id));
drop policy if exists activity_events_write_own on public.activity_events;
create policy activity_events_write_own on public.activity_events for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists strategy_versions_own on public.strategy_versions;
create policy strategy_versions_own on public.strategy_versions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.workout_sessions replica identity full;
alter table public.exercise_sets replica identity full;
alter table public.daily_metrics replica identity full;
alter table public.personal_records replica identity full;
alter table public.activity_events replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.workout_sessions;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.exercise_sets;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.daily_metrics;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.personal_records;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.activity_events;
exception when duplicate_object then null;
end $$;

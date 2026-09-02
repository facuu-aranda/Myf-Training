create table if not exists public.food_sources (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  name text not null,
  source_url text not null,
  license text not null default '',
  attribution text not null default '',
  imported_at timestamptz not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.foods (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.food_sources(id) on delete restrict,
  external_id text not null,
  name text not null,
  name_es text not null default '',
  name_en text,
  description text not null default '',
  category text not null default '',
  subcategory text not null default '',
  food_group text not null default '',
  brand text,
  barcode text,
  default_unit text not null default 'g' check (default_unit in ('g', 'kg', 'mg', 'ml', 'l', 'unit', 'cup', 'tablespoon', 'teaspoon', 'slice', 'portion', 'piece')),
  is_basic_food boolean not null default true,
  is_packaged boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (source_id, external_id)
);

create table if not exists public.food_nutrients (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references public.foods(id) on delete cascade,
  basis text not null check (basis in ('per_100g', 'per_100ml', 'per_unit')),
  calories numeric(10, 2) check (calories is null or calories >= 0),
  protein_g numeric(10, 2) check (protein_g is null or protein_g >= 0),
  carbohydrates_g numeric(10, 2) check (carbohydrates_g is null or carbohydrates_g >= 0),
  fat_g numeric(10, 2) check (fat_g is null or fat_g >= 0),
  fiber_g numeric(10, 2) check (fiber_g is null or fiber_g >= 0),
  saturated_fat_g numeric(10, 2) check (saturated_fat_g is null or saturated_fat_g >= 0),
  sugar_g numeric(10, 2) check (sugar_g is null or sugar_g >= 0),
  sodium_mg numeric(10, 2) check (sodium_mg is null or sodium_mg >= 0),
  cholesterol_mg numeric(10, 2) check (cholesterol_mg is null or cholesterol_mg >= 0),
  micronutrients jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (food_id, basis)
);

create table if not exists public.food_portions (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references public.foods(id) on delete cascade,
  label text not null,
  unit text not null check (unit in ('g', 'kg', 'mg', 'ml', 'l', 'unit', 'cup', 'tablespoon', 'teaspoon', 'slice', 'portion', 'piece')),
  grams numeric(10, 3) check (grams is null or grams > 0),
  ml numeric(10, 3) check (ml is null or ml > 0),
  is_default boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check ((grams is not null and grams > 0) or (ml is not null and ml > 0)),
  unique (food_id, unit, label)
);

create table if not exists public.food_aliases (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references public.foods(id) on delete cascade,
  alias text not null,
  language text not null default 'es' check (language in ('es', 'en', 'pt', 'other')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (food_id, alias, language)
);

create table if not exists public.food_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  food_id uuid not null references public.foods(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, food_id)
);

create index if not exists foods_search_idx on public.foods using gin (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(name_es, '') || ' ' || coalesce(name_en, '') || ' ' || coalesce(description, '') || ' ' || coalesce(category, '') || ' ' || coalesce(subcategory, '') || ' ' || coalesce(food_group, '')));
create index if not exists foods_source_idx on public.foods(source_id, external_id);
create index if not exists food_nutrients_food_idx on public.food_nutrients(food_id, basis);
create index if not exists food_portions_food_idx on public.food_portions(food_id, is_default desc);
create index if not exists food_aliases_search_idx on public.food_aliases using gin (to_tsvector('simple', alias));
create index if not exists food_favorites_user_idx on public.food_favorites(user_id, created_at desc);

drop trigger if exists food_sources_set_updated_at on public.food_sources;
create trigger food_sources_set_updated_at before update on public.food_sources for each row execute function public.set_updated_at();
drop trigger if exists foods_set_updated_at on public.foods;
create trigger foods_set_updated_at before update on public.foods for each row execute function public.set_updated_at();
drop trigger if exists food_nutrients_set_updated_at on public.food_nutrients;
create trigger food_nutrients_set_updated_at before update on public.food_nutrients for each row execute function public.set_updated_at();
drop trigger if exists food_portions_set_updated_at on public.food_portions;
create trigger food_portions_set_updated_at before update on public.food_portions for each row execute function public.set_updated_at();

alter table public.food_sources enable row level security;
alter table public.foods enable row level security;
alter table public.food_nutrients enable row level security;
alter table public.food_portions enable row level security;
alter table public.food_aliases enable row level security;
alter table public.food_favorites enable row level security;

drop policy if exists food_sources_select_authenticated on public.food_sources;
create policy food_sources_select_authenticated on public.food_sources for select using (auth.role() = 'authenticated');
drop policy if exists foods_select_authenticated on public.foods;
create policy foods_select_authenticated on public.foods for select using (auth.role() = 'authenticated');
drop policy if exists food_nutrients_select_authenticated on public.food_nutrients;
create policy food_nutrients_select_authenticated on public.food_nutrients for select using (auth.role() = 'authenticated');
drop policy if exists food_portions_select_authenticated on public.food_portions;
create policy food_portions_select_authenticated on public.food_portions for select using (auth.role() = 'authenticated');
drop policy if exists food_aliases_select_authenticated on public.food_aliases;
create policy food_aliases_select_authenticated on public.food_aliases for select using (auth.role() = 'authenticated');
drop policy if exists food_favorites_own on public.food_favorites;
create policy food_favorites_own on public.food_favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());

  create table if not exists public.recipes (
    id uuid primary key default gen_random_uuid(),
    created_by uuid references auth.users(id) on delete set null,
    couple_id uuid references public.couples(id) on delete cascade,
    name text not null,
    name_es text not null default '',
    description text not null default '',
    instructions text not null default '',
    prep_time_minutes integer not null default 0 check (prep_time_minutes >= 0),
    cook_time_minutes integer not null default 0 check (cook_time_minutes >= 0),
    servings numeric(8, 2) not null default 1 check (servings > 0),
    image_url text,
    visibility text not null default 'private' check (visibility in ('private', 'household', 'system')),
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    check (visibility = 'system' or created_by is not null),
    check (visibility <> 'household' or couple_id is not null)
  );

  create table if not exists public.recipe_ingredients (
    id uuid primary key default gen_random_uuid(),
    recipe_id uuid not null references public.recipes(id) on delete cascade,
    food_id uuid not null references public.foods(id) on delete restrict,
    food_portion_id uuid references public.food_portions(id) on delete set null,
    quantity numeric(10, 3) not null check (quantity > 0),
    unit text not null check (unit in ('g', 'kg', 'mg', 'ml', 'l', 'unit', 'cup', 'tablespoon', 'teaspoon', 'slice', 'portion', 'piece')),
    normalized_grams numeric(12, 3) check (normalized_grams is null or normalized_grams > 0),
    normalized_ml numeric(12, 3) check (normalized_ml is null or normalized_ml > 0),
    notes text not null default '',
    order_index integer not null default 0 check (order_index >= 0),
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    unique (recipe_id, order_index)
  );

  create index if not exists recipes_created_by_idx on public.recipes(created_by, updated_at desc);
  create index if not exists recipes_couple_idx on public.recipes(couple_id, updated_at desc);
  create index if not exists recipes_visibility_idx on public.recipes(visibility, updated_at desc);
  create index if not exists recipe_ingredients_recipe_idx on public.recipe_ingredients(recipe_id, order_index);
  create index if not exists recipe_ingredients_food_idx on public.recipe_ingredients(food_id);

  drop trigger if exists recipes_set_updated_at on public.recipes;
  create trigger recipes_set_updated_at before update on public.recipes for each row execute function public.set_updated_at();
  drop trigger if exists recipe_ingredients_set_updated_at on public.recipe_ingredients;
  create trigger recipe_ingredients_set_updated_at before update on public.recipe_ingredients for each row execute function public.set_updated_at();

  alter table public.recipes enable row level security;
  alter table public.recipe_ingredients enable row level security;

  drop policy if exists recipes_select_visible on public.recipes;
  create policy recipes_select_visible on public.recipes for select using (
    visibility = 'system'
    or created_by = auth.uid()
    or (visibility = 'household' and exists (select 1 from public.couple_members where couple_id = recipes.couple_id and user_id = auth.uid()))
  );
  drop policy if exists recipes_insert_own on public.recipes;
  create policy recipes_insert_own on public.recipes for insert with check (
    created_by = auth.uid()
    and (visibility = 'private' or (visibility = 'household' and exists (select 1 from public.couple_members where couple_id = recipes.couple_id and user_id = auth.uid())))
  );
  drop policy if exists recipes_update_own on public.recipes;
  create policy recipes_update_own on public.recipes for update using (created_by = auth.uid()) with check (
    created_by = auth.uid()
    and (visibility = 'private' or (visibility = 'household' and exists (select 1 from public.couple_members where couple_id = recipes.couple_id and user_id = auth.uid())))
  );
  drop policy if exists recipes_delete_own on public.recipes;
  create policy recipes_delete_own on public.recipes for delete using (created_by = auth.uid());

  drop policy if exists recipe_ingredients_select_visible on public.recipe_ingredients;
  create policy recipe_ingredients_select_visible on public.recipe_ingredients for select using (exists (select 1 from public.recipes where id = recipe_ingredients.recipe_id));
  drop policy if exists recipe_ingredients_insert_own on public.recipe_ingredients;
  create policy recipe_ingredients_insert_own on public.recipe_ingredients for insert with check (exists (select 1 from public.recipes where id = recipe_ingredients.recipe_id and created_by = auth.uid()));
  drop policy if exists recipe_ingredients_update_own on public.recipe_ingredients;
  create policy recipe_ingredients_update_own on public.recipe_ingredients for update using (exists (select 1 from public.recipes where id = recipe_ingredients.recipe_id and created_by = auth.uid())) with check (exists (select 1 from public.recipes where id = recipe_ingredients.recipe_id and created_by = auth.uid()));
  drop policy if exists recipe_ingredients_delete_own on public.recipe_ingredients;
  create policy recipe_ingredients_delete_own on public.recipe_ingredients for delete using (exists (select 1 from public.recipes where id = recipe_ingredients.recipe_id and created_by = auth.uid()));

-- Add household_id to nutrition tables
ALTER TABLE public.food_logs ADD COLUMN household_id uuid references public.households(id) on delete cascade;
ALTER TABLE public.meal_plans ADD COLUMN household_id uuid references public.households(id) on delete cascade;
ALTER TABLE public.grocery_lists ADD COLUMN household_id uuid references public.households(id) on delete cascade;
ALTER TABLE public.recipes ADD COLUMN household_id uuid references public.households(id) on delete cascade;

-- Migrate data
UPDATE public.food_logs f SET household_id = h.id FROM public.households h WHERE f.couple_id = h.legacy_couple_id;
UPDATE public.meal_plans m SET household_id = h.id FROM public.households h WHERE m.couple_id = h.legacy_couple_id;
UPDATE public.grocery_lists g SET household_id = h.id FROM public.households h WHERE g.couple_id = h.legacy_couple_id;
UPDATE public.recipes r SET household_id = h.id FROM public.households h WHERE r.couple_id = h.legacy_couple_id;

-- Drop old policies first
DROP POLICY IF EXISTS food_logs_select ON public.food_logs;
DROP POLICY IF EXISTS food_logs_insert ON public.food_logs;
DROP POLICY IF EXISTS food_logs_update ON public.food_logs;
DROP POLICY IF EXISTS food_log_items_visible ON public.food_log_items;

DROP POLICY IF EXISTS meal_plans_select ON public.meal_plans;
DROP POLICY IF EXISTS meal_plans_insert ON public.meal_plans;
DROP POLICY IF EXISTS meal_plans_update ON public.meal_plans;

DROP POLICY IF EXISTS grocery_lists_household_select ON public.grocery_lists;
DROP POLICY IF EXISTS grocery_lists_household_insert ON public.grocery_lists;
DROP POLICY IF EXISTS grocery_lists_household_update ON public.grocery_lists;
DROP POLICY IF EXISTS grocery_lists_household_delete ON public.grocery_lists;

DROP POLICY IF EXISTS grocery_list_items_household_select ON public.grocery_list_items;
DROP POLICY IF EXISTS grocery_list_items_household_insert ON public.grocery_list_items;
DROP POLICY IF EXISTS grocery_list_items_household_update ON public.grocery_list_items;
DROP POLICY IF EXISTS grocery_list_items_household_delete ON public.grocery_list_items;

DROP POLICY IF EXISTS recipes_select ON public.recipes;
DROP POLICY IF EXISTS recipes_insert ON public.recipes;
DROP POLICY IF EXISTS recipes_update ON public.recipes;

DROP POLICY IF EXISTS food_logs_own ON public.food_logs;
DROP POLICY IF EXISTS food_logs_select_visible ON public.food_logs;
DROP POLICY IF EXISTS food_logs_insert_own ON public.food_logs;
DROP POLICY IF EXISTS food_logs_update_own ON public.food_logs;
DROP POLICY IF EXISTS food_logs_delete_own ON public.food_logs;
DROP POLICY IF EXISTS food_log_items_own ON public.food_log_items;
DROP POLICY IF EXISTS food_log_items_insert_own ON public.food_log_items;
DROP POLICY IF EXISTS food_log_items_update_own ON public.food_log_items;
DROP POLICY IF EXISTS food_log_items_delete_own ON public.food_log_items;
DROP POLICY IF EXISTS meal_plans_select_visible ON public.meal_plans;
DROP POLICY IF EXISTS meal_plans_insert_own ON public.meal_plans;
DROP POLICY IF EXISTS meal_plans_update_own ON public.meal_plans;
DROP POLICY IF EXISTS meal_plans_delete_own ON public.meal_plans;
DROP POLICY IF EXISTS recipes_select_visible ON public.recipes;
DROP POLICY IF EXISTS recipes_insert_own ON public.recipes;
DROP POLICY IF EXISTS recipes_update_own ON public.recipes;
DROP POLICY IF EXISTS recipes_delete_own ON public.recipes;

-- Update constraints and indexes (and drop couple_id)
-- food_logs
DROP INDEX IF EXISTS food_logs_couple_date_idx;
CREATE INDEX IF NOT EXISTS food_logs_household_date_idx ON public.food_logs(household_id, consumed_on desc, consumed_at desc);
ALTER TABLE public.food_logs DROP COLUMN couple_id;

-- meal_plans
ALTER TABLE public.meal_plans DROP CONSTRAINT IF EXISTS meal_plans_visibility_check;
ALTER TABLE public.meal_plans ADD CONSTRAINT meal_plans_visibility_check CHECK (visibility = 'private' or household_id is not null);
DROP INDEX IF EXISTS meal_plans_couple_idx;
CREATE INDEX IF NOT EXISTS meal_plans_household_idx ON public.meal_plans(household_id, starts_on desc);
ALTER TABLE public.meal_plans DROP COLUMN couple_id;

-- grocery_lists
ALTER TABLE public.grocery_lists DROP CONSTRAINT IF EXISTS grocery_lists_couple_id_starts_on_ends_on_key;
-- Set NOT NULL only if there are no nulls (which should be true after data migration, or if previously it was NOT NULL)
-- Wait, if there are grocery_lists without a household, it will fail.
-- It was not null before, so all have a legacy_couple_id. Let's make it NOT NULL.
ALTER TABLE public.grocery_lists ALTER COLUMN household_id SET NOT NULL;
ALTER TABLE public.grocery_lists ADD CONSTRAINT grocery_lists_household_id_starts_on_ends_on_key UNIQUE (household_id, starts_on, ends_on);
DROP INDEX IF EXISTS grocery_lists_couple_date_idx;
CREATE INDEX IF NOT EXISTS grocery_lists_household_date_idx ON public.grocery_lists(household_id, starts_on desc, ends_on desc);
ALTER TABLE public.grocery_lists DROP COLUMN couple_id;

-- recipes
ALTER TABLE public.recipes DROP CONSTRAINT IF EXISTS recipes_visibility_check;
ALTER TABLE public.recipes ADD CONSTRAINT recipes_visibility_check CHECK (visibility <> 'household' or household_id is not null);
DROP INDEX IF EXISTS recipes_couple_idx;
CREATE INDEX IF NOT EXISTS recipes_household_idx ON public.recipes(household_id, updated_at desc);
ALTER TABLE public.recipes DROP COLUMN couple_id;

-- Create new policies
-- food_logs
create policy food_logs_select on public.food_logs for select using (user_id = auth.uid() or (visibility = 'household' and exists (select 1 from public.household_members where household_id = food_logs.household_id and user_id = auth.uid())));
create policy food_logs_insert on public.food_logs for insert with check (user_id = auth.uid() and (visibility = 'private' or exists (select 1 from public.household_members where household_id = food_logs.household_id and user_id = auth.uid())));
create policy food_logs_update on public.food_logs for update using (user_id = auth.uid()) with check (user_id = auth.uid() and (visibility = 'private' or exists (select 1 from public.household_members where household_id = food_logs.household_id and user_id = auth.uid())));
create policy food_log_items_visible on public.food_log_items for select using (exists (select 1 from public.food_logs where id = food_log_items.food_log_id and (user_id = auth.uid() or (visibility = 'household' and exists (select 1 from public.household_members where household_id = food_logs.household_id and user_id = auth.uid())))));

-- meal_plans
create policy meal_plans_select on public.meal_plans for select using (user_id = auth.uid() or (visibility = 'household' and exists (select 1 from public.household_members where household_id = meal_plans.household_id and user_id = auth.uid())));
create policy meal_plans_insert on public.meal_plans for insert with check (user_id = auth.uid() and (visibility = 'private' or exists (select 1 from public.household_members where household_id = meal_plans.household_id and user_id = auth.uid())));
create policy meal_plans_update on public.meal_plans for update using (user_id = auth.uid()) with check (user_id = auth.uid() and (visibility = 'private' or exists (select 1 from public.household_members where household_id = meal_plans.household_id and user_id = auth.uid())));

-- grocery_lists
create policy grocery_lists_household_select on public.grocery_lists for select using (exists (select 1 from public.household_members where household_id = grocery_lists.household_id and user_id = auth.uid()));
create policy grocery_lists_household_insert on public.grocery_lists for insert with check (created_by = auth.uid() and exists (select 1 from public.household_members where household_id = grocery_lists.household_id and user_id = auth.uid()));
create policy grocery_lists_household_update on public.grocery_lists for update using (exists (select 1 from public.household_members where household_id = grocery_lists.household_id and user_id = auth.uid())) with check (exists (select 1 from public.household_members where household_id = grocery_lists.household_id and user_id = auth.uid()));
create policy grocery_lists_household_delete on public.grocery_lists for delete using (exists (select 1 from public.household_members where household_id = grocery_lists.household_id and user_id = auth.uid()));

create policy grocery_list_items_household_select on public.grocery_list_items for select using (exists (select 1 from public.grocery_lists where id = grocery_list_items.grocery_list_id and exists (select 1 from public.household_members where household_id = grocery_lists.household_id and user_id = auth.uid())));
create policy grocery_list_items_household_insert on public.grocery_list_items for insert with check (exists (select 1 from public.grocery_lists where id = grocery_list_items.grocery_list_id and exists (select 1 from public.household_members where household_id = grocery_lists.household_id and user_id = auth.uid())));
create policy grocery_list_items_household_update on public.grocery_list_items for update using (exists (select 1 from public.grocery_lists where id = grocery_list_items.grocery_list_id and exists (select 1 from public.household_members where household_id = grocery_lists.household_id and user_id = auth.uid()))) with check (exists (select 1 from public.grocery_lists where id = grocery_list_items.grocery_list_id and exists (select 1 from public.household_members where household_id = grocery_lists.household_id and user_id = auth.uid())));
create policy grocery_list_items_household_delete on public.grocery_list_items for delete using (exists (select 1 from public.grocery_lists where id = grocery_list_items.grocery_list_id and exists (select 1 from public.household_members where household_id = grocery_lists.household_id and user_id = auth.uid())));

-- recipes
create policy recipes_select on public.recipes for select using (created_by = auth.uid() or (visibility = 'household' and exists (select 1 from public.household_members where household_id = recipes.household_id and user_id = auth.uid())));
create policy recipes_insert on public.recipes for insert with check (created_by = auth.uid() and (visibility = 'private' or (visibility = 'household' and exists (select 1 from public.household_members where household_id = recipes.household_id and user_id = auth.uid()))));
create policy recipes_update on public.recipes for update using (created_by = auth.uid()) with check (created_by = auth.uid() and (visibility = 'private' or (visibility = 'household' and exists (select 1 from public.household_members where household_id = recipes.household_id and user_id = auth.uid()))));

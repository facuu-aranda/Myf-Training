create or replace function public.is_household_member(target_household_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
security definer stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.household_members member
    where member.household_id = target_household_id
      and member.user_id = target_user_id
      and member.left_at is null
  );
$$;

grant execute on function public.is_household_member(uuid, uuid) to anon, authenticated, service_role;

drop function if exists public.is_household_owner(uuid);
create or replace function public.is_household_owner(target_household_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
security definer stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.households household
    where household.id = target_household_id
      and household.owner_user_id = target_user_id
  );
$$;

grant execute on function public.is_household_owner(uuid, uuid) to anon, authenticated, service_role;

create or replace function public.is_same_household_user(target_user_id uuid, viewer_user_id uuid default auth.uid())
returns boolean
language sql
security definer stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.household_members mine
    join public.household_members target on target.household_id = mine.household_id
    where mine.user_id = viewer_user_id
      and mine.left_at is null
      and target.user_id = target_user_id
      and target.left_at is null
  );
$$;

grant execute on function public.is_same_household_user(uuid, uuid) to anon, authenticated, service_role;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (id = auth.uid() or public.is_same_household_user(id));

drop policy if exists "Households select" on public.households;
drop policy if exists "Households update" on public.households;
drop policy if exists "Households insert" on public.households;
drop policy if exists "Households delete" on public.households;
drop policy if exists households_select_visible on public.households;
drop policy if exists households_update_owner on public.households;
drop policy if exists households_insert_owner on public.households;
drop policy if exists households_delete_owner on public.households;
create policy households_select_visible on public.households for select using (public.is_household_member(id) or owner_user_id = auth.uid());
create policy households_update_owner on public.households for update using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy households_insert_owner on public.households for insert with check (owner_user_id = auth.uid());
create policy households_delete_owner on public.households for delete using (owner_user_id = auth.uid());

drop policy if exists "Household members select" on public.household_members;
drop policy if exists "Household members all" on public.household_members;
drop policy if exists "Household members delete self" on public.household_members;
drop policy if exists household_members_select_visible on public.household_members;
drop policy if exists household_members_insert_owner on public.household_members;
drop policy if exists household_members_update_owner on public.household_members;
drop policy if exists household_members_delete_owner_or_self on public.household_members;
create policy household_members_select_visible on public.household_members for select using (user_id = auth.uid() or public.is_household_member(household_id));
create policy household_members_insert_owner on public.household_members for insert with check (public.is_household_owner(household_id));
create policy household_members_update_owner on public.household_members for update using (public.is_household_owner(household_id)) with check (public.is_household_owner(household_id));
create policy household_members_delete_owner_or_self on public.household_members for delete using (user_id = auth.uid() or public.is_household_owner(household_id));

drop policy if exists workout_sessions_select_shared on public.workout_sessions;
create policy workout_sessions_select_shared on public.workout_sessions for select using (user_id = auth.uid() or public.is_same_household_user(user_id));
drop policy if exists exercise_sets_select_shared on public.exercise_sets;
create policy exercise_sets_select_shared on public.exercise_sets for select using (exists (select 1 from public.workout_sessions where id = exercise_sets.session_id and (user_id = auth.uid() or public.is_same_household_user(user_id))));
drop policy if exists daily_metrics_select_shared on public.daily_metrics;
create policy daily_metrics_select_shared on public.daily_metrics for select using (user_id = auth.uid() or public.is_same_household_user(user_id));
drop policy if exists personal_records_select_shared on public.personal_records;
create policy personal_records_select_shared on public.personal_records for select using (user_id = auth.uid() or public.is_same_household_user(user_id));
drop policy if exists activity_events_select_shared on public.activity_events;
create policy activity_events_select_shared on public.activity_events for select using (user_id = auth.uid() or public.is_same_household_user(user_id));

drop policy if exists "Invitations insert" on public.household_invitations;
drop policy if exists household_invitations_insert_member on public.household_invitations;
create policy household_invitations_insert_member on public.household_invitations for insert with check (inviter_user_id = auth.uid() and public.is_household_member(household_id));

create or replace function public.add_household_member(p_household_id uuid, p_user_id uuid, p_role text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  max_member_count integer;
  active_member_count integer;
begin
  if auth.uid() is null or p_user_id <> auth.uid() then
    return false;
  end if;

  if not exists (
    select 1
    from public.household_invitations invitation
    where invitation.household_id = p_household_id
      and invitation.invitee_user_id = auth.uid()
      and invitation.status = 'pending'
      and invitation.expires_at > now()
  ) then
    return false;
  end if;

  select household.max_members into max_member_count from public.households household where household.id = p_household_id;
  if max_member_count is null then return false; end if;

  select count(*) into active_member_count from public.household_members member where member.household_id = p_household_id and member.left_at is null;
  if active_member_count >= max_member_count then return false; end if;

  insert into public.household_members (household_id, user_id, role)
  values (p_household_id, p_user_id, case when p_role in ('owner', 'member') then p_role else 'member' end)
  on conflict (household_id, user_id) do update set left_at = null, role = excluded.role;

  return true;
end;
$$;

grant execute on function public.add_household_member(uuid, uuid, text) to authenticated;

grant select on public.public_profiles to anon, authenticated;

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
    'realtime_tables', jsonb_build_array('workout_sessions', 'exercise_sets', 'daily_metrics', 'personal_records', 'activity_events', 'food_logs', 'food_log_items', 'meal_plans', 'meal_plan_days', 'planned_meals', 'grocery_lists', 'grocery_list_items', 'households', 'household_members', 'household_invitations', 'profile_follows')
  );
$$;
grant execute on function public.health_check() to authenticated, service_role;

alter table public.households replica identity full;
alter table public.household_members replica identity full;
alter table public.household_invitations replica identity full;
alter table public.profile_follows replica identity full;
do $$
begin
  alter publication supabase_realtime add table public.households;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.household_members;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.household_invitations;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.profile_follows;
exception when duplicate_object then null;
end $$;

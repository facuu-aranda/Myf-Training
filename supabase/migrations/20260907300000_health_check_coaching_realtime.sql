begin;

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
    'realtime_tables', jsonb_build_array('foods', 'workout_sessions', 'exercise_sets', 'daily_metrics', 'personal_records', 'activity_events', 'food_logs', 'food_log_items', 'meal_plans', 'meal_plan_days', 'planned_meals', 'grocery_lists', 'grocery_list_items', 'households', 'household_members', 'household_invitations', 'profile_follows', 'strategy_versions', 'strategy_management', 'coach_notes', 'space_invitations', 'coach_athlete_relationships')
  );
$$;

grant execute on function public.health_check() to authenticated, service_role;

commit;

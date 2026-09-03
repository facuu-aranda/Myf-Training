select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'profiles', 'couples', 'couple_members', 'households', 'household_members',
    'household_invitations', 'profile_follows', 'nutrition_plans',
    'food_sources', 'foods', 'food_nutrients', 'food_portions', 'food_aliases', 'food_favorites',
    'recipes', 'recipe_ingredients', 'food_logs', 'food_log_items',
    'meal_plans', 'meal_plan_days', 'planned_meals', 'grocery_lists', 'grocery_list_items',
    'exercises', 'workout_days', 'workout_exercises', 'workout_sessions',
    'exercise_sets', 'daily_metrics', 'personal_records', 'activity_events', 'strategy_versions'
  )
order by table_name;

select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'profiles' and column_name in ('public_handle', 'public_code', 'discoverable', 'profile_visibility', 'progress_visibility'))
    or (table_name in ('recipes', 'food_logs', 'meal_plans', 'grocery_lists') and column_name = 'household_id')
  )
order by table_name, column_name;

select pubname, schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
  and tablename in (
    'workout_sessions', 'exercise_sets', 'daily_metrics', 'personal_records', 'activity_events',
    'food_logs', 'food_log_items', 'meal_plans', 'meal_plan_days', 'planned_meals',
    'grocery_lists', 'grocery_list_items',
    'households', 'household_members', 'household_invitations', 'profile_follows'
  )
order by tablename;

select public.health_check();

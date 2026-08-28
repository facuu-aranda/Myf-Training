select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles', 'couples', 'couple_members', 'nutrition_plans', 'exercises', 'workout_days', 'workout_exercises', 'workout_sessions', 'exercise_sets', 'daily_metrics', 'personal_records', 'activity_events', 'strategy_versions')
order by table_name;

select pubname, schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
  and tablename in ('workout_sessions', 'exercise_sets', 'daily_metrics', 'personal_records', 'activity_events')
order by tablename;

select public.health_check();

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceRoleKey) throw new Error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running yarn db:check.')
const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
const tables = ['profiles', 'couples', 'couple_members', 'households', 'household_members', 'household_invitations', 'profile_follows', 'food_sources', 'foods', 'food_nutrients', 'food_portions', 'food_aliases', 'food_favorites', 'recipes', 'recipe_ingredients', 'food_logs', 'food_log_items', 'meal_plans', 'meal_plan_days', 'planned_meals', 'grocery_lists', 'grocery_list_items', 'exercises', 'workout_days', 'workout_exercises', 'workout_sessions', 'exercise_sets', 'daily_metrics', 'personal_records', 'activity_events', 'strategy_versions']

async function main() {
  const results: Record<string, number> = {}
  for (const table of tables) {
    const result = await admin.from(table).select('*', { count: 'exact', head: true })
    if (result.error) throw new Error(`${table}: ${result.error.message}`)
    results[table] = result.count ?? 0
  }
  const health = await admin.rpc('health_check')
  if (health.error) throw new Error(`health_check: ${health.error.message}`)
  const users = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (users.error) throw users.error
  const requiredColumns: Array<[string, string]> = [
    ['profiles', 'id, public_handle, public_code, discoverable, profile_visibility, progress_visibility'],
    ['recipes', 'id, household_id'],
    ['food_logs', 'id, household_id, visibility'],
    ['meal_plans', 'id, household_id'],
    ['grocery_lists', 'id, household_id'],
  ]
  for (const [table, columns] of requiredColumns) {
    const schemaCheck = await admin.from(table).select(columns).limit(1)
    if (schemaCheck.error) throw new Error(`${table} schema: ${schemaCheck.error.message}. Apply the household migration.`)
  }
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!anonKey) throw new Error('Set VITE_SUPABASE_ANON_KEY so db:check can verify the public RLS path.')
  const publicClient = createClient(supabaseUrl as string, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const profileRlsCheck = await publicClient.from('profiles').select('id').limit(1)
  if (profileRlsCheck.error) throw new Error(`profiles RLS: ${profileRlsCheck.error.message}. Apply the household RLS fix migration.`)
  const publicProfilesCheck = await publicClient.from('public_profiles').select('id, public_handle, public_code').limit(1)
  if (publicProfilesCheck.error) throw new Error(`public profiles: ${publicProfilesCheck.error.message}. Check the public profile grant/view.`)
  const translationResult = await admin.from('foods').select('id', { count: 'exact', head: true }).not('name_es', 'is', null).neq('name_es', '').not('name_en', 'is', null).neq('name_en', '')
  if (translationResult.error) throw new Error(`food translations: ${translationResult.error.message}`)
  const translatedFoods = translationResult.count ?? 0
  console.table(results)
  console.log(`Auth users: ${users.data.users.length}`)
  const realtimeTables = (health.data as { realtime_tables?: string[] })?.realtime_tables ?? []
  console.log(`Food translations: ${translatedFoods}/${results.foods}`)
  console.log('Realtime tables:', realtimeTables.join(', ') || 'not reported')
  if (results.profiles < 2 || results.households < 1 || results.household_members < 2 || results.exercises < 1) throw new Error('Database is connected but initial seed data is incomplete. Run yarn seed.')
  if (results.foods < 1 || results.food_nutrients < 1 || results.food_portions < 1) throw new Error('Nutrition foundation is connected but the food catalog is incomplete. Run yarn seed:foods.')
  if (translatedFoods < results.foods) throw new Error('Some foods are missing Spanish or English names. Run yarn seed:foods.')
  const missingNutritionRealtime = ['food_logs', 'food_log_items', 'meal_plans', 'meal_plan_days', 'planned_meals', 'grocery_lists', 'grocery_list_items', 'households', 'household_members', 'household_invitations', 'profile_follows'].filter((table) => !realtimeTables.includes(table))
  if (missingNutritionRealtime.length) throw new Error(`Nutrition Realtime is missing: ${missingNutritionRealtime.join(', ')}. Apply the latest nutrition migration.`)
  console.log('Database check passed.')
}
void main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1 })

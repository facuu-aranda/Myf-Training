import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceRoleKey) throw new Error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running yarn db:check.')
const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
const tables = ['profiles', 'couples', 'couple_members', 'food_sources', 'foods', 'food_nutrients', 'food_portions', 'food_aliases', 'food_favorites', 'recipes', 'recipe_ingredients', 'food_logs', 'food_log_items', 'meal_plans', 'meal_plan_days', 'planned_meals', 'grocery_lists', 'grocery_list_items', 'exercises', 'workout_days', 'workout_exercises', 'workout_sessions', 'exercise_sets', 'daily_metrics', 'personal_records', 'activity_events', 'strategy_versions']

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
  const foodSharing = await admin.from('food_logs').select('id, couple_id, visibility').limit(1)
  if (foodSharing.error) throw new Error(`food log sharing: ${foodSharing.error.message}. Apply the food sharing migration.`)
  const translationResult = await admin.from('foods').select('id', { count: 'exact', head: true }).not('name_es', 'is', null).neq('name_es', '').not('name_en', 'is', null).neq('name_en', '')
  if (translationResult.error) throw new Error(`food translations: ${translationResult.error.message}`)
  const translatedFoods = translationResult.count ?? 0
  console.table(results)
  console.log(`Auth users: ${users.data.users.length}`)
  const realtimeTables = (health.data as { realtime_tables?: string[] })?.realtime_tables ?? []
  console.log(`Food translations: ${translatedFoods}/${results.foods}`)
  console.log('Realtime tables:', realtimeTables.join(', ') || 'not reported')
  if (results.profiles < 2 || results.couples < 1 || results.exercises < 1) throw new Error('Database is connected but initial seed data is incomplete. Run yarn seed.')
  if (results.foods < 1 || results.food_nutrients < 1 || results.food_portions < 1) throw new Error('Nutrition foundation is connected but the food catalog is incomplete. Run yarn seed:foods.')
  if (translatedFoods < results.foods) throw new Error('Some foods are missing Spanish or English names. Run yarn seed:foods.')
  const missingNutritionRealtime = ['food_logs', 'food_log_items', 'meal_plans', 'meal_plan_days', 'planned_meals', 'grocery_lists', 'grocery_list_items'].filter((table) => !realtimeTables.includes(table))
  if (missingNutritionRealtime.length) throw new Error(`Nutrition Realtime is missing: ${missingNutritionRealtime.join(', ')}. Apply the latest nutrition migration.`)
  console.log('Database check passed.')
}
void main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1 })

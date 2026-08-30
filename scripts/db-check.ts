import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceRoleKey) throw new Error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running yarn db:check.')
const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
const tables = ['profiles', 'couples', 'couple_members', 'exercises', 'workout_days', 'workout_exercises', 'workout_sessions', 'exercise_sets', 'daily_metrics', 'personal_records', 'activity_events']

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
  console.table(results)
  console.log(`Auth users: ${users.data.users.length}`)
  console.log('Realtime tables:', (health.data as { realtime_tables?: string[] })?.realtime_tables?.join(', ') ?? 'not reported')
  if (results.profiles < 2 || results.couples < 1 || results.exercises < 1) throw new Error('Database is connected but initial seed data is incomplete. Run yarn seed.')
  console.log('Database check passed.')
}
void main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1 })

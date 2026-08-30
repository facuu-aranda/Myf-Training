import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'
import { demoState } from '../src/data/demo'
import type { Exercise, Profile } from '../src/types'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceRoleKey) throw new Error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running yarn seed.')

const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
const coupleId = '11111111-1111-4111-8111-111111111111'
const accountPasswords: Record<string, string | undefined> = { fabricio: process.env.FABRICIO_PASSWORD, maria: process.env.MARIA_PASSWORD }

function stableUuid(value: string) {
  const hex = createHash('sha256').update(value).digest('hex').slice(0, 32).split('')
  hex[12] = '5'; hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16)
  return `${hex.slice(0, 8).join('')}-${hex.slice(8, 12).join('')}-${hex.slice(12, 16).join('')}-${hex.slice(16, 20).join('')}-${hex.slice(20).join('')}`
}

async function getOrCreateUser(username: string) {
  const email = `${username}@train-together.local`
  const listed = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (listed.error) throw listed.error
  const existing = listed.data.users.find((user) => user.email === email)
  if (existing) return existing.id
  const password = accountPasswords[username]
  if (!password) throw new Error(`Set ${username.toUpperCase()}_PASSWORD to create the predefined account.`)
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { username } })
  if (created.error || !created.data.user) throw created.error ?? new Error(`Could not create ${username}`)
  return created.data.user.id
}

async function upsert(table: string, rows: Array<Record<string, unknown>>, onConflict = 'id') {
  if (!rows.length) return
  const result = await admin.from(table).upsert(rows, { onConflict })
  if (result.error) throw result.error
}

function exerciseRow(exercise: Exercise) {
  return { external_id: exercise.externalId, name: exercise.name, name_es: exercise.nameEs, description: exercise.description, instructions: { en: exercise.instructions, es: exercise.instructionsEs }, muscle_group: exercise.muscleGroup, target: exercise.target, category: exercise.category, equipment: exercise.equipment, video_url: exercise.gifUrl ?? null, thumbnail_url: exercise.imageUrl ?? null, image_url: exercise.imageUrl ?? null, source: exercise.source, source_url: exercise.sourceUrl, metadata: { demo_id: exercise.id } }
}

async function seed() {
  const userIds: Record<string, string> = { fabricio: await getOrCreateUser('fabricio'), maria: await getOrCreateUser('maria') }
  await upsert('couples', [{ id: coupleId, name: 'Train Together' }])
  const profiles = demoState.profiles.map((profile: Profile) => ({ id: userIds[profile.username], username: profile.username, display_name: profile.displayName, first_name: profile.firstName, avatar_url: profile.avatarUrl, height_cm: profile.heightCm, weight_kg: profile.weightKg, daily_step_goal: profile.dailyStepGoal, daily_calorie_goal: profile.dailyCalorieGoal, active: profile.active }))
  await upsert('profiles', profiles)
  await upsert('couple_members', Object.values(userIds).map((userId) => ({ couple_id: coupleId, user_id: userId })), 'couple_id,user_id')
  await upsert('nutrition_plans', demoState.nutritionPlans.map((plan) => ({ id: stableUuid(`nutrition:${plan.userId}`), user_id: userIds[demoState.profiles.find((profile) => profile.id === plan.userId)?.username ?? ''], calories: plan.calories, protein: plan.protein, carbs: plan.carbs, fats: plan.fats, fiber: plan.fiber, notes: plan.notes, starts_on: plan.startsOn })))
  await upsert('exercises', demoState.exercises.map(exerciseRow), 'external_id')
  const exerciseQuery = await admin.from('exercises').select('id, external_id')
  if (exerciseQuery.error) throw exerciseQuery.error
  const exerciseIds = new Map((exerciseQuery.data as Array<{ id: string; external_id: string }>).map((row) => [row.external_id, row.id]))
  const dayRows = demoState.workoutDays.map((day) => ({ id: stableUuid(`day:${userIds[demoState.profiles.find((profile) => profile.id === day.userId)?.username ?? '']}:${day.id}`), user_id: userIds[demoState.profiles.find((profile) => profile.id === day.userId)?.username ?? ''], name: day.name, name_es: day.nameEs, description: day.description, weekday: day.weekday, order_index: day.orderIndex, active: day.active, estimated_minutes: day.estimatedMinutes }))
  await upsert('workout_days', dayRows)
  const dayIds = new Map(demoState.workoutDays.map((day) => [day.id, stableUuid(`day:${userIds[demoState.profiles.find((profile) => profile.id === day.userId)?.username ?? '']}:${day.id}`)]))
  const planRows = demoState.workoutDays.flatMap((day) => day.exercises.map((plan) => ({ id: stableUuid(`plan:${plan.id}`), workout_day_id: dayIds.get(day.id), exercise_id: exerciseIds.get(demoState.exercises.find((exercise) => exercise.id === plan.exerciseId)?.externalId ?? ''), order_index: plan.orderIndex, sets: plan.sets, target_reps: plan.targetReps, target_seconds: plan.targetSeconds ?? null, target_weight: plan.targetWeight, rest_seconds: plan.restSeconds, notes: plan.notes })))
  await upsert('workout_exercises', planRows)
  const sessionId = new Map(demoState.sessions.map((session) => [session.id, stableUuid(`session:${session.id}`)]))
  const sessionRows = demoState.sessions.map((session) => ({ id: sessionId.get(session.id), user_id: userIds[demoState.profiles.find((profile) => profile.id === session.userId)?.username ?? ''], workout_day_id: dayIds.get(session.workoutDayId), started_at: session.startedAt, finished_at: session.finishedAt ?? null, duration_seconds: session.durationSeconds, overall_feeling: session.overallFeeling, energy: session.energy, fatigue: session.fatigue, mood: session.mood, difficulty: session.difficulty, notes: session.notes, status: session.status }))
  await upsert('workout_sessions', sessionRows)
  const setRows = demoState.sessions.flatMap((session) => session.sets.map((set) => ({ id: stableUuid(`set:${set.id}`), session_id: sessionId.get(session.id), exercise_id: exerciseIds.get(demoState.exercises.find((exercise) => exercise.id === set.exerciseId)?.externalId ?? ''), set_number: set.setNumber, planned_weight: set.plannedWeight, actual_weight: set.actualWeight, planned_reps: set.plannedReps, actual_reps: set.actualReps, difficulty: set.difficulty, feeling: set.feeling, pain_level: set.painLevel, rest_seconds: set.restSeconds, notes: set.notes, completed_at: set.completedAt })))
  await upsert('exercise_sets', setRows, 'session_id,exercise_id,set_number')
  await upsert('daily_metrics', demoState.dailyMetrics.map((metric) => ({ id: stableUuid(`metric:${metric.userId}:${metric.date}`), user_id: userIds[demoState.profiles.find((profile) => profile.id === metric.userId)?.username ?? ''], date: metric.date, steps: metric.steps, calories: metric.calories, body_weight: metric.bodyWeight, notes: metric.notes })), 'user_id,date')
  await upsert('personal_records', demoState.personalRecords.map((record) => ({ id: stableUuid(`pr:${record.id}`), user_id: userIds[demoState.profiles.find((profile) => profile.id === record.userId)?.username ?? ''], exercise_id: record.exerciseId ? exerciseIds.get(demoState.exercises.find((exercise) => exercise.id === record.exerciseId)?.externalId ?? '') : null, record_type: record.recordType, value: record.value, unit: record.unit, achieved_at: record.achievedAt, label: record.label })), 'user_id,exercise_id,record_type')
  await upsert('activity_events', demoState.activityEvents.map((event) => ({ id: stableUuid(`event:${event.id}`), user_id: userIds[demoState.profiles.find((profile) => profile.id === event.userId)?.username ?? ''], event_type: event.eventType, title: event.title, description: event.description, entity_type: event.entityType, entity_id: event.entityId ? sessionId.get(event.entityId) ?? null : null, metadata: event.metadata ?? {}, created_at: event.createdAt })))
  console.log(`Seeded ${Object.keys(userIds).length} users, ${demoState.exercises.length} exercises, ${demoState.workoutDays.length} workout days, ${demoState.sessions.length} sessions and ${demoState.dailyMetrics.length} daily metrics.`)
}

void seed().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1 })

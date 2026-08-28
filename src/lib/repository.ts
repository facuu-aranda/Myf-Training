import { supabase } from './supabase'
import type { AppState, DailyMetric, Exercise, ExerciseSet, NutritionPlan, PersonalRecord, Profile, WorkoutDay, WorkoutExercise, WorkoutSession } from '../types'

interface Row { [key: string]: unknown }
const rows = (value: unknown): Row[] => Array.isArray(value) ? value as Row[] : []
const stringValue = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback
const numberValue = (value: unknown, fallback = 0) => typeof value === 'number' ? value : Number(value ?? fallback) || fallback
const booleanValue = (value: unknown, fallback = false) => typeof value === 'boolean' ? value : fallback
const arrayValue = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

function profileFromRow(row: Row): Profile {
  return { id: stringValue(row.id), username: stringValue(row.username), displayName: stringValue(row.display_name), firstName: stringValue(row.first_name, stringValue(row.display_name).split(' ')[0]), avatarUrl: stringValue(row.avatar_url), heightCm: numberValue(row.height_cm), weightKg: numberValue(row.weight_kg), dailyStepGoal: numberValue(row.daily_step_goal, 10000), dailyCalorieGoal: numberValue(row.daily_calorie_goal, 2000), active: booleanValue(row.active, true), createdAt: stringValue(row.created_at), updatedAt: stringValue(row.updated_at) }
}

function exerciseFromRow(row: Row): Exercise {
  const instructions = (row.instructions && typeof row.instructions === 'object' ? row.instructions : {}) as Row
  return { id: stringValue(row.id), externalId: stringValue(row.external_id), name: stringValue(row.name), nameEs: stringValue(row.name_es, stringValue(row.name)), description: stringValue(row.description), instructions: arrayValue(instructions.en), instructionsEs: arrayValue(instructions.es), category: stringValue(row.category), muscleGroup: stringValue(row.muscle_group), target: stringValue(row.target), equipment: stringValue(row.equipment), gifUrl: stringValue(row.video_url) || undefined, imageUrl: stringValue(row.image_url) || stringValue(row.thumbnail_url) || undefined, source: stringValue(row.source, 'exercises-dataset'), sourceUrl: stringValue(row.source_url) }
}

function planFromRow(row: Row): WorkoutExercise {
  return { id: stringValue(row.id), workoutDayId: stringValue(row.workout_day_id), exerciseId: stringValue(row.exercise_id), orderIndex: numberValue(row.order_index), sets: numberValue(row.sets, 3), targetReps: numberValue(row.target_reps, 10), targetSeconds: row.target_seconds ? numberValue(row.target_seconds) : undefined, targetWeight: numberValue(row.target_weight), restSeconds: numberValue(row.rest_seconds, 60), notes: stringValue(row.notes) }
}

function dayFromRow(row: Row): WorkoutDay {
  return { id: stringValue(row.id), userId: stringValue(row.user_id), name: stringValue(row.name), nameEs: stringValue(row.name_es, stringValue(row.name)), description: stringValue(row.description), weekday: numberValue(row.weekday, 1), orderIndex: numberValue(row.order_index), active: booleanValue(row.active, true), estimatedMinutes: numberValue(row.estimated_minutes, 45), exercises: rows(row.workout_exercises).map(planFromRow), createdAt: stringValue(row.created_at), updatedAt: stringValue(row.updated_at) }
}

function setFromRow(row: Row): ExerciseSet {
  return { id: stringValue(row.id), sessionId: stringValue(row.session_id), exerciseId: stringValue(row.exercise_id), setNumber: numberValue(row.set_number, 1), plannedWeight: numberValue(row.planned_weight), actualWeight: numberValue(row.actual_weight), plannedReps: numberValue(row.planned_reps), actualReps: numberValue(row.actual_reps), difficulty: numberValue(row.difficulty, 5), feeling: numberValue(row.feeling, 3), painLevel: numberValue(row.pain_level), restSeconds: numberValue(row.rest_seconds), notes: stringValue(row.notes), completedAt: stringValue(row.completed_at) }
}

function sessionFromRow(row: Row): WorkoutSession {
  return { id: stringValue(row.id), userId: stringValue(row.user_id), workoutDayId: stringValue(row.workout_day_id), startedAt: stringValue(row.started_at), finishedAt: stringValue(row.finished_at) || undefined, durationSeconds: numberValue(row.duration_seconds), overallFeeling: numberValue(row.overall_feeling, 3), energy: numberValue(row.energy, 3), fatigue: numberValue(row.fatigue, 3), mood: numberValue(row.mood, 3), difficulty: numberValue(row.difficulty, 5), notes: stringValue(row.notes), status: stringValue(row.status, 'active') as WorkoutSession['status'], sets: rows(row.exercise_sets).map(setFromRow) }
}

export async function loadRemoteState(): Promise<AppState | null> {
  if (!supabase) return null
  const [profileResult, nutritionResult, exerciseResult, dayResult, sessionResult, metricResult, recordResult, eventResult] = await Promise.all([
    supabase.from('profiles').select('*'), supabase.from('nutrition_plans').select('*'), supabase.from('exercises').select('*').order('name'), supabase.from('workout_days').select('*, workout_exercises(*)').order('order_index'), supabase.from('workout_sessions').select('*, exercise_sets(*)').order('started_at', { ascending: false }), supabase.from('daily_metrics').select('*').order('date', { ascending: false }), supabase.from('personal_records').select('*').order('achieved_at', { ascending: false }), supabase.from('activity_events').select('*').order('created_at', { ascending: false }),
  ])
  if (profileResult.error || !profileResult.data?.length) return null
  const profiles = rows(profileResult.data).map(profileFromRow)
  const nutritionPlans: NutritionPlan[] = rows(nutritionResult.data).map((row) => ({ id: stringValue(row.id), userId: stringValue(row.user_id), calories: numberValue(row.calories, 2000), protein: numberValue(row.protein), carbs: numberValue(row.carbs), fats: numberValue(row.fats), fiber: numberValue(row.fiber), notes: stringValue(row.notes), startsOn: stringValue(row.starts_on), updatedAt: stringValue(row.updated_at) }))
  const exercises = rows(exerciseResult.data).map(exerciseFromRow)
  const workoutDays = rows(dayResult.data).map(dayFromRow)
  const sessions = rows(sessionResult.data).map(sessionFromRow)
  const dailyMetrics: DailyMetric[] = rows(metricResult.data).map((row) => ({ id: stringValue(row.id), userId: stringValue(row.user_id), date: stringValue(row.date), steps: numberValue(row.steps), calories: numberValue(row.calories), bodyWeight: numberValue(row.body_weight), notes: stringValue(row.notes), createdAt: stringValue(row.created_at), updatedAt: stringValue(row.updated_at) }))
  const personalRecords: PersonalRecord[] = rows(recordResult.data).map((row) => ({ id: stringValue(row.id), userId: stringValue(row.user_id), exerciseId: stringValue(row.exercise_id) || undefined, recordType: stringValue(row.record_type, 'weight') as PersonalRecord['recordType'], value: numberValue(row.value), unit: stringValue(row.unit), achievedAt: stringValue(row.achieved_at), label: stringValue(row.label) }))
  const activityEvents = rows(eventResult.data).map((row) => ({ id: stringValue(row.id), userId: stringValue(row.user_id), eventType: stringValue(row.event_type, 'metric_updated') as AppState['activityEvents'][number]['eventType'], title: stringValue(row.title), description: stringValue(row.description), entityType: stringValue(row.entity_type), entityId: stringValue(row.entity_id) || undefined, metadata: (row.metadata && typeof row.metadata === 'object' ? row.metadata : {}) as Record<string, string | number>, createdAt: stringValue(row.created_at) }))
  return { profiles, nutritionPlans, exercises, workoutDays, sessions, dailyMetrics, personalRecords, activityEvents }
}

async function save(table: string, payload: Row | Row[], options?: { onConflict?: string }) {
  if (!supabase) return
  const result = await supabase.from(table).upsert(payload, options)
  if (result.error) throw result.error
}

export function persistProfile(profile: Profile) { return save('profiles', { id: profile.id, username: profile.username, display_name: profile.displayName, first_name: profile.firstName, avatar_url: profile.avatarUrl, height_cm: profile.heightCm, weight_kg: profile.weightKg, daily_step_goal: profile.dailyStepGoal, daily_calorie_goal: profile.dailyCalorieGoal, active: profile.active }) }
export function persistNutrition(plan: NutritionPlan) { return save('nutrition_plans', { id: plan.id, user_id: plan.userId, calories: plan.calories, protein: plan.protein, carbs: plan.carbs, fats: plan.fats, fiber: plan.fiber, notes: plan.notes, starts_on: plan.startsOn }) }
export function persistWorkoutDay(day: WorkoutDay) { return save('workout_days', { id: day.id, user_id: day.userId, name: day.name, name_es: day.nameEs, description: day.description, weekday: day.weekday, order_index: day.orderIndex, active: day.active, estimated_minutes: day.estimatedMinutes }) }
export function persistWorkoutExercise(plan: WorkoutExercise) { return save('workout_exercises', { id: plan.id, workout_day_id: plan.workoutDayId, exercise_id: plan.exerciseId, order_index: plan.orderIndex, sets: plan.sets, target_reps: plan.targetReps, target_seconds: plan.targetSeconds ?? null, target_weight: plan.targetWeight, rest_seconds: plan.restSeconds, notes: plan.notes }) }
export function deleteRemoteWorkoutDay(id: string) { return supabase ? supabase.from('workout_days').delete().eq('id', id).then((result) => { if (result.error) throw result.error }) : Promise.resolve() }
export function deleteRemoteWorkoutExercise(id: string) { return supabase ? supabase.from('workout_exercises').delete().eq('id', id).then((result) => { if (result.error) throw result.error }) : Promise.resolve() }
export function deleteRemoteSet(id: string) { return supabase ? supabase.from('exercise_sets').delete().eq('id', id).then((result) => { if (result.error) throw result.error }) : Promise.resolve() }
export function persistSession(session: WorkoutSession) { return save('workout_sessions', { id: session.id, user_id: session.userId, workout_day_id: session.workoutDayId || null, started_at: session.startedAt, finished_at: session.finishedAt ?? null, duration_seconds: session.durationSeconds, overall_feeling: session.overallFeeling, energy: session.energy, fatigue: session.fatigue, mood: session.mood, difficulty: session.difficulty, notes: session.notes, status: session.status }) }
export function persistSet(set: ExerciseSet) { return save('exercise_sets', { id: set.id, session_id: set.sessionId, exercise_id: set.exerciseId, set_number: set.setNumber, planned_weight: set.plannedWeight, actual_weight: set.actualWeight, planned_reps: set.plannedReps, actual_reps: set.actualReps, difficulty: set.difficulty, feeling: set.feeling, pain_level: set.painLevel, rest_seconds: set.restSeconds, notes: set.notes, completed_at: set.completedAt }) }
export function persistMetric(metric: DailyMetric) { return save('daily_metrics', { id: metric.id, user_id: metric.userId, date: metric.date, steps: metric.steps, calories: metric.calories, body_weight: metric.bodyWeight, notes: metric.notes }, { onConflict: 'user_id,date' }) }
export function persistRecord(record: PersonalRecord) { return save('personal_records', { id: record.id, user_id: record.userId, exercise_id: record.exerciseId ?? null, record_type: record.recordType, value: record.value, unit: record.unit, achieved_at: record.achievedAt, label: record.label }, { onConflict: 'user_id,exercise_id,record_type' }) }
export function persistEvent(event: AppState['activityEvents'][number]) { return save('activity_events', { id: event.id, user_id: event.userId, event_type: event.eventType, title: event.title, description: event.description, entity_type: event.entityType, entity_id: event.entityId ?? null, metadata: event.metadata ?? {}, created_at: event.createdAt }) }

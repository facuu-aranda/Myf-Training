import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { demoState } from '../data/demo'
import { getDateKey, uid } from '../lib/utils'
import { templateNames, templateWeekdays } from '../lib/workout-builder'
import { isSupabaseConfigured, subscribeToFitnessChanges } from '../lib/supabase'
import { STORAGE_KEY, readStorage, writeStorage } from '../lib/storage'
import { loadRemoteState, persistEvent, persistMetric, persistNutrition, persistProfile, persistRecord, persistSession, persistSet, persistWorkoutDay, persistWorkoutExercise, deleteRemoteWorkoutDay, deleteRemoteWorkoutExercise, deleteRemoteSet } from '../lib/repository'
import type { AppState, DailyMetric, ExerciseSet, LiveSetDraft, NutritionPlan, PersonalRecord, Profile, QuickLogEntry, WorkoutDay, WorkoutExercise, WorkoutSession } from '../types'

export interface FitnessContextValue extends AppState {
  isRealtimeConnected: boolean
  lastSyncedAt: string
  refreshFromRemote: () => Promise<void>
  updateProfile: (profileId: string, patch: Partial<Profile>) => void
  updateNutrition: (userId: string, patch: Partial<NutritionPlan>) => void
  addWorkoutDay: (userId: string) => void
  updateWorkoutDay: (dayId: string, patch: Partial<WorkoutDay>) => void
  removeWorkoutDay: (dayId: string) => void
  reorderWorkoutDays: (userId: string, dayIds: string[]) => void
  duplicateWorkoutDay: (userId: string, dayId: string) => void
  createWorkoutTemplate: (userId: string, dayCount: 3 | 4 | 5) => void
  addExerciseToDay: (dayId: string, exerciseId: string) => void
  reorderWorkoutExercises: (dayId: string, exerciseIds: string[]) => void
  duplicateWorkoutExercise: (dayId: string, exercisePlanId: string) => void
  updateWorkoutExercise: (exercisePlanId: string, patch: Partial<WorkoutExercise>) => void
  removeExerciseFromDay: (exercisePlanId: string) => void
  startSession: (userId: string, workoutDayId: string) => string
  getActiveSession: (userId: string) => WorkoutSession | undefined
  recordSet: (sessionId: string, exercisePlan: WorkoutExercise, draft: LiveSetDraft) => ExerciseSet | undefined
  removeSet: (sessionId: string, setId: string) => void
  saveQuickSession: (userId: string, workoutDayId: string, entries: QuickLogEntry[], feedback?: Partial<WorkoutSession>) => string | undefined
  completeSession: (sessionId: string, feedback: Partial<WorkoutSession>) => void
  abandonSession: (sessionId: string) => void
  updateDailyMetric: (userId: string, patch: Partial<DailyMetric>) => void
}

export const FitnessContext = createContext<FitnessContextValue | undefined>(undefined)

function hydrateState(): AppState {
  const saved = readStorage<Partial<AppState> | null>(STORAGE_KEY, null)
  if (!saved) return demoState
  return {
    profiles: saved.profiles ?? demoState.profiles,
    nutritionPlans: saved.nutritionPlans ?? demoState.nutritionPlans,
    exercises: saved.exercises ?? demoState.exercises,
    workoutDays: saved.workoutDays ?? demoState.workoutDays,
    sessions: saved.sessions ?? demoState.sessions,
    dailyMetrics: saved.dailyMetrics ?? demoState.dailyMetrics,
    personalRecords: saved.personalRecords ?? demoState.personalRecords,
    activityEvents: saved.activityEvents ?? demoState.activityEvents,
  }
}

function getExerciseName(exercises: AppState['exercises'], exerciseId: string) {
  return exercises.find((exercise) => exercise.id === exerciseId)?.name ?? 'Exercise'
}

function fireRemote(task: PromiseLike<unknown> | undefined) {
  if (!task) return
  void Promise.resolve(task).catch((error: unknown) => { console.warn('Train Together remote persistence failed', error instanceof Error ? error.message : error) })
}

export function FitnessProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(hydrateState)
  const [lastSyncedAt, setLastSyncedAt] = useState(new Date().toISOString())
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(isSupabaseConfigured)

  useEffect(() => { writeStorage(STORAGE_KEY, state) }, [state])

  const refreshFromRemote = useCallback(async () => {
    const remote = await loadRemoteState()
    if (remote) { setState(remote); setLastSyncedAt(new Date().toISOString()) }
  }, [])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return
      try { setState(JSON.parse(event.newValue) as AppState); setLastSyncedAt(new Date().toISOString()) } catch { return }
    }
    window.addEventListener('storage', handleStorage)
    const unsubscribe = subscribeToFitnessChanges(() => { setLastSyncedAt(new Date().toISOString()); void refreshFromRemote() })
    if (isSupabaseConfigured) {
      setIsRealtimeConnected(true)
      void refreshFromRemote()
    }
    return () => { window.removeEventListener('storage', handleStorage); unsubscribe() }
  }, [refreshFromRemote])

  const commit = useCallback((updater: (current: AppState) => AppState) => {
    setState((current) => updater(current))
    setLastSyncedAt(new Date().toISOString())
  }, [])

  const updateProfile = useCallback((profileId: string, patch: Partial<Profile>) => {
    const existing = state.profiles.find((profile) => profile.id === profileId)
    if (!existing) return
    const next = { ...existing, ...patch, updatedAt: new Date().toISOString() }
    commit((current) => ({ ...current, profiles: current.profiles.map((profile) => profile.id === profileId ? next : profile) }))
    fireRemote(persistProfile(next))
  }, [commit, state.profiles])

  const updateNutrition = useCallback((userId: string, patch: Partial<NutritionPlan>) => {
    const existing = state.nutritionPlans.find((plan) => plan.userId === userId)
    const next: NutritionPlan = existing ? { ...existing, ...patch, updatedAt: new Date().toISOString() } : { id: uid('nutrition'), userId, calories: 2000, protein: 0, carbs: 0, fats: 0, fiber: 0, notes: '', startsOn: getDateKey(), updatedAt: new Date().toISOString(), ...patch }
    commit((current) => ({ ...current, nutritionPlans: existing ? current.nutritionPlans.map((plan) => plan.userId === userId ? next : plan) : [...current.nutritionPlans, next] }))
    fireRemote(persistNutrition(next))
  }, [commit, state.nutritionPlans])

  const addWorkoutDay = useCallback((userId: string) => {
    const userDays = state.workoutDays.filter((day) => day.userId === userId)
    const id = uid('day'); const now = new Date().toISOString()
    const day: WorkoutDay = { id, userId, name: 'New training day', nameEs: 'Nuevo día', description: 'A space for your next focus.', weekday: Math.min(7, userDays.length + 1), orderIndex: userDays.length, active: true, estimatedMinutes: 40, exercises: [], createdAt: now, updatedAt: now }
    commit((current) => ({ ...current, workoutDays: [...current.workoutDays, day] }))
    fireRemote(persistWorkoutDay(day))
  }, [commit, state.workoutDays])

  const updateWorkoutDay = useCallback((dayId: string, patch: Partial<WorkoutDay>) => {
    const existing = state.workoutDays.find((day) => day.id === dayId)
    if (!existing) return
    const next = { ...existing, ...patch, updatedAt: new Date().toISOString() }
    commit((current) => ({ ...current, workoutDays: current.workoutDays.map((day) => day.id === dayId ? next : day) }))
    fireRemote(persistWorkoutDay(next))
  }, [commit, state.workoutDays])

  const removeWorkoutDay = useCallback((dayId: string) => {
    commit((current) => ({ ...current, workoutDays: current.workoutDays.filter((day) => day.id !== dayId) }))
    fireRemote(deleteRemoteWorkoutDay(dayId))
  }, [commit])

  const reorderWorkoutDays = useCallback((userId: string, dayIds: string[]) => {
    const nextDays = state.workoutDays.map((day) => day.userId === userId ? { ...day, orderIndex: Math.max(0, dayIds.indexOf(day.id)) } : day).sort((a, b) => a.orderIndex - b.orderIndex)
    commit((current) => ({ ...current, workoutDays: nextDays }))
    nextDays.filter((day) => day.userId === userId).forEach((day) => fireRemote(persistWorkoutDay(day)))
  }, [commit, state.workoutDays])

  const duplicateWorkoutDay = useCallback((userId: string, dayId: string) => {
    const source = state.workoutDays.find((day) => day.id === dayId && day.userId === userId)
    if (!source) return
    const now = new Date().toISOString()
    const userDays = state.workoutDays.filter((day) => day.userId === userId)
    const duplicateId = uid('day')
    const duplicate: WorkoutDay = { ...source, id: duplicateId, name: `${source.name} copy`, nameEs: `${source.nameEs} copia`, orderIndex: userDays.length, exercises: source.exercises.map((plan, index) => ({ ...plan, id: uid('plan'), workoutDayId: duplicateId, orderIndex: index })), createdAt: now, updatedAt: now }
    commit((current) => ({ ...current, workoutDays: [...current.workoutDays, duplicate] }))
    fireRemote(persistWorkoutDay(duplicate))
    duplicate.exercises.forEach((plan) => fireRemote(persistWorkoutExercise(plan)))
  }, [commit, state.workoutDays])

  const createWorkoutTemplate = useCallback((userId: string, dayCount: 3 | 4 | 5) => {
    const now = new Date().toISOString()
    const weekdays = templateWeekdays(dayCount)
    const names = templateNames(dayCount)
    const days = weekdays.map((weekday, index) => ({ id: uid('day'), userId, name: names[index][0], nameEs: names[index][1], description: '', weekday, orderIndex: index, active: true, estimatedMinutes: 45, exercises: [], createdAt: now, updatedAt: now }))
    commit((current) => ({ ...current, workoutDays: [...current.workoutDays, ...days] }))
    days.forEach((day) => fireRemote(persistWorkoutDay(day)))
  }, [commit])

  const addExerciseToDay = useCallback((dayId: string, exerciseId: string) => {
    const day = state.workoutDays.find((item) => item.id === dayId)
    if (!day) return
    const plan: WorkoutExercise = { id: uid('plan'), workoutDayId: dayId, exerciseId, orderIndex: day.exercises.length, sets: 3, targetReps: 10, targetWeight: 0, restSeconds: 60, notes: '' }
    commit((current) => ({ ...current, workoutDays: current.workoutDays.map((item) => item.id === dayId ? { ...item, exercises: [...item.exercises, plan], updatedAt: new Date().toISOString() } : item) }))
    fireRemote(persistWorkoutExercise(plan))
  }, [commit, state.workoutDays])

  const reorderWorkoutExercises = useCallback((dayId: string, exerciseIds: string[]) => {
    const day = state.workoutDays.find((item) => item.id === dayId)
    if (!day) return
    const nextExercises = day.exercises.map((plan) => ({ ...plan, orderIndex: Math.max(0, exerciseIds.indexOf(plan.id)) })).sort((left, right) => left.orderIndex - right.orderIndex)
    commit((current) => ({ ...current, workoutDays: current.workoutDays.map((item) => item.id === dayId ? { ...item, exercises: nextExercises, updatedAt: new Date().toISOString() } : item) }))
    nextExercises.forEach((plan) => fireRemote(persistWorkoutExercise(plan)))
  }, [commit, state.workoutDays])

  const duplicateWorkoutExercise = useCallback((dayId: string, exercisePlanId: string) => {
    const day = state.workoutDays.find((item) => item.id === dayId)
    const source = day?.exercises.find((plan) => plan.id === exercisePlanId)
    if (!day || !source) return
    const duplicate: WorkoutExercise = { ...source, id: uid('plan'), orderIndex: day.exercises.length }
    commit((current) => ({ ...current, workoutDays: current.workoutDays.map((item) => item.id === dayId ? { ...item, exercises: [...item.exercises, duplicate], updatedAt: new Date().toISOString() } : item) }))
    fireRemote(persistWorkoutExercise(duplicate))
  }, [commit, state.workoutDays])

  const updateWorkoutExercise = useCallback((exercisePlanId: string, patch: Partial<WorkoutExercise>) => {
    const existing = state.workoutDays.flatMap((day) => day.exercises).find((plan) => plan.id === exercisePlanId)
    if (!existing) return
    const next = { ...existing, ...patch }
    commit((current) => ({ ...current, workoutDays: current.workoutDays.map((day) => ({ ...day, exercises: day.exercises.map((plan) => plan.id === exercisePlanId ? next : plan), updatedAt: new Date().toISOString() })) }))
    fireRemote(persistWorkoutExercise(next))
  }, [commit, state.workoutDays])

  const removeExerciseFromDay = useCallback((exercisePlanId: string) => {
    const remaining = state.workoutDays.flatMap((day) => day.exercises.filter((plan) => plan.id !== exercisePlanId).map((plan, index) => ({ ...plan, orderIndex: index })))
    commit((current) => ({ ...current, workoutDays: current.workoutDays.map((day) => ({ ...day, exercises: day.exercises.filter((plan) => plan.id !== exercisePlanId).map((plan, index) => ({ ...plan, orderIndex: index })) })) }))
    fireRemote(deleteRemoteWorkoutExercise(exercisePlanId))
    remaining.forEach((plan) => fireRemote(persistWorkoutExercise(plan)))
  }, [commit, state.workoutDays])

  const startSession = useCallback((userId: string, workoutDayId: string) => {
    const currentActive = state.sessions.find((session) => session.userId === userId && session.status === 'active')
    if (currentActive) return currentActive.id
    const id = uid('session'); const now = new Date().toISOString()
    const session: WorkoutSession = { id, userId, workoutDayId, startedAt: now, durationSeconds: 0, overallFeeling: 3, energy: 3, fatigue: 3, mood: 3, difficulty: 5, notes: '', status: 'active', sets: [] }
    const event = { id: uid('event'), userId, eventType: 'workout_started' as const, title: 'Workout started', description: 'A new session is underway.', entityType: 'workout_session', entityId: id, createdAt: now }
    commit((current) => ({ ...current, sessions: [...current.sessions, session], activityEvents: [event, ...current.activityEvents] }))
    fireRemote(persistSession(session)); fireRemote(persistEvent(event))
    return id
  }, [commit, state.sessions])

  const getActiveSession = useCallback((userId: string) => state.sessions.find((session) => session.userId === userId && session.status === 'active'), [state.sessions])

  const recordSet = useCallback((sessionId: string, exercisePlan: WorkoutExercise, draft: LiveSetDraft) => {
    const session = state.sessions.find((item) => item.id === sessionId)
    if (!session) return undefined
    const actualWeight = Number(draft.weight) || 0; const actualReps = Number(draft.reps) || 0; const completedAt = new Date().toISOString()
    const set: ExerciseSet = { id: uid('set'), sessionId, exerciseId: exercisePlan.exerciseId, setNumber: session.sets.filter((item) => item.exerciseId === exercisePlan.exerciseId).length + 1, plannedWeight: exercisePlan.targetWeight, actualWeight, plannedReps: exercisePlan.targetReps, actualReps, difficulty: draft.difficulty, feeling: draft.feeling, painLevel: draft.pain, restSeconds: exercisePlan.restSeconds, notes: draft.notes, completedAt }
    const existingRecord = state.personalRecords.find((record) => record.userId === session.userId && record.exerciseId === exercisePlan.exerciseId && record.recordType === 'weight')
    const isNewRecord = actualWeight > (existingRecord?.value ?? 0) && actualWeight > 0
    const newRecord: PersonalRecord | undefined = isNewRecord ? { id: uid('pr'), userId: session.userId, exerciseId: exercisePlan.exerciseId, recordType: 'weight', value: actualWeight, unit: 'kg', achievedAt: completedAt, label: `${getExerciseName(state.exercises, exercisePlan.exerciseId)} · max weight` } : undefined
    const event = newRecord ? { id: uid('event'), userId: session.userId, eventType: 'personal_record' as const, title: 'New personal record', description: `${getExerciseName(state.exercises, exercisePlan.exerciseId)} · ${actualWeight} kg`, entityType: 'personal_record', entityId: newRecord.id, createdAt: completedAt } : undefined
    commit((current) => ({ ...current, sessions: current.sessions.map((item) => item.id === sessionId ? { ...item, sets: [...item.sets, set] } : item), personalRecords: newRecord ? [...current.personalRecords.filter((record) => record.id !== existingRecord?.id), newRecord] : current.personalRecords, activityEvents: event ? [event, ...current.activityEvents] : current.activityEvents }))
    fireRemote(persistSet(set)); if (newRecord) fireRemote(persistRecord(newRecord)); if (event) fireRemote(persistEvent(event))
    return set
  }, [commit, state.exercises, state.personalRecords, state.sessions])

  const removeSet = useCallback((sessionId: string, setId: string) => {
    commit((current) => ({ ...current, sessions: current.sessions.map((session) => session.id === sessionId ? { ...session, sets: session.sets.filter((set) => set.id !== setId) } : session) }))
    fireRemote(deleteRemoteSet(setId))
  }, [commit])

  const saveQuickSession = useCallback((userId: string, workoutDayId: string, entries: QuickLogEntry[], feedback: Partial<WorkoutSession> = {}) => {
    if (!entries.length) return undefined
    const id = uid('session'); const startedAt = new Date().toISOString(); const finishedAt = new Date().toISOString()
    const sets = entries.flatMap((entry) => Array.from({ length: Math.max(0, entry.setsCompleted) }, (_, index): ExerciseSet => ({ id: uid('set'), sessionId: id, exerciseId: entry.plan.exerciseId, setNumber: index + 1, plannedWeight: entry.plan.targetWeight, actualWeight: Number(entry.draft.weight) || 0, plannedReps: entry.plan.targetReps, actualReps: Number(entry.draft.reps) || 0, difficulty: entry.draft.difficulty, feeling: entry.draft.feeling, painLevel: entry.draft.pain, restSeconds: entry.plan.restSeconds, notes: entry.draft.notes, completedAt: finishedAt })))
    const newRecords = entries.reduce<PersonalRecord[]>((records, entry) => {
      const exerciseSets = sets.filter((set) => set.exerciseId === entry.plan.exerciseId)
      const best = exerciseSets.reduce<ExerciseSet | undefined>((currentBest, set) => !currentBest || set.actualWeight > currentBest.actualWeight ? set : currentBest, undefined)
      const existing = state.personalRecords.find((record) => record.userId === userId && record.exerciseId === entry.plan.exerciseId && record.recordType === 'weight')
      if (!best || best.actualWeight <= 0 || best.actualWeight <= (existing?.value ?? 0) || records.some((record) => record.exerciseId === entry.plan.exerciseId)) return records
      return [...records, { id: uid('pr'), userId, exerciseId: entry.plan.exerciseId, recordType: 'weight', value: best.actualWeight, unit: 'kg', achievedAt: finishedAt, label: `${getExerciseName(state.exercises, entry.plan.exerciseId)} · max weight` }]
    }, [])
    const day = state.workoutDays.find((item) => item.id === workoutDayId); const owner = state.profiles.find((profile) => profile.id === userId)?.firstName ?? 'Your'; const volume = sets.reduce((sum, set) => sum + set.actualWeight * set.actualReps, 0)
    const session: WorkoutSession = { id, userId, workoutDayId, startedAt, finishedAt, durationSeconds: feedback.durationSeconds ?? 0, overallFeeling: feedback.overallFeeling ?? 4, energy: feedback.energy ?? 4, fatigue: feedback.fatigue ?? 3, mood: feedback.mood ?? 4, difficulty: feedback.difficulty ?? 7, notes: feedback.notes ?? '', status: 'completed', sets }
    const workoutEvent = { id: uid('event'), userId, eventType: 'workout_completed' as const, title: `${owner} completed ${day?.name ?? 'workout'}`, description: `${Math.round(volume)} kg volume`, entityType: 'workout_session', entityId: id, createdAt: finishedAt }
    const recordEvents = newRecords.map((record) => ({ id: uid('event'), userId, eventType: 'personal_record' as const, title: 'New personal record', description: record.label, entityType: 'personal_record', entityId: record.id, createdAt: finishedAt }))
    commit((current) => ({ ...current, sessions: [...current.sessions, session], personalRecords: [...current.personalRecords.filter((record) => !newRecords.some((next) => next.exerciseId === record.exerciseId && next.recordType === record.recordType)), ...newRecords], activityEvents: [...recordEvents, workoutEvent, ...current.activityEvents] }))
    fireRemote(persistSession(session)); sets.forEach((set) => fireRemote(persistSet(set))); newRecords.forEach((record) => fireRemote(persistRecord(record))); [...recordEvents, workoutEvent].forEach((event) => fireRemote(persistEvent(event)))
    return id
  }, [commit, state.exercises, state.personalRecords, state.profiles, state.workoutDays])

  const completeSession = useCallback((sessionId: string, feedback: Partial<WorkoutSession>) => {
    const existing = state.sessions.find((session) => session.id === sessionId)
    if (!existing) return
    const finishedAt = new Date().toISOString(); const day = state.workoutDays.find((item) => item.id === existing.workoutDayId); const owner = state.profiles.find((profile) => profile.id === existing.userId)?.firstName ?? 'Your'
    const next = { ...existing, ...feedback, finishedAt, status: 'completed' as const }
    const event = { id: uid('event'), userId: existing.userId, eventType: 'workout_completed' as const, title: `${owner} completed ${day?.name ?? 'workout'}`, description: `${Math.round((feedback.durationSeconds ?? existing.durationSeconds) / 60)} min · ${Math.round(existing.sets.reduce((sum, set) => sum + set.actualWeight * set.actualReps, 0))} kg volume`, entityType: 'workout_session', entityId: sessionId, createdAt: finishedAt }
    commit((current) => ({ ...current, sessions: current.sessions.map((session) => session.id === sessionId ? next : session), activityEvents: [event, ...current.activityEvents] }))
    fireRemote(persistSession(next)); fireRemote(persistEvent(event))
  }, [commit, state.profiles, state.sessions, state.workoutDays])

  const abandonSession = useCallback((sessionId: string) => {
    const existing = state.sessions.find((session) => session.id === sessionId)
    if (!existing) return
    const next = { ...existing, status: 'abandoned' as const, finishedAt: new Date().toISOString() }
    commit((current) => ({ ...current, sessions: current.sessions.map((session) => session.id === sessionId ? next : session) }))
    fireRemote(persistSession(next))
  }, [commit, state.sessions])

  const updateDailyMetric = useCallback((userId: string, patch: Partial<DailyMetric>) => {
    const date = patch.date ?? getDateKey(); const existing = state.dailyMetrics.find((metric) => metric.userId === userId && metric.date === date); const now = new Date().toISOString()
    const next: DailyMetric = existing ? { ...existing, ...patch, updatedAt: now } : { id: uid('metric'), userId, date, steps: patch.steps ?? 0, calories: patch.calories ?? 0, bodyWeight: patch.bodyWeight ?? 0, notes: patch.notes ?? '', createdAt: now, updatedAt: now }
    commit((current) => ({ ...current, dailyMetrics: existing ? current.dailyMetrics.map((metric) => metric.id === existing.id ? next : metric) : [...current.dailyMetrics, next] }))
    fireRemote(persistMetric(next))
  }, [commit, state.dailyMetrics])

  const value = useMemo<FitnessContextValue>(() => ({ ...state, isRealtimeConnected, lastSyncedAt, refreshFromRemote, updateProfile, updateNutrition, addWorkoutDay, updateWorkoutDay, removeWorkoutDay, reorderWorkoutDays, duplicateWorkoutDay, createWorkoutTemplate, addExerciseToDay, reorderWorkoutExercises, duplicateWorkoutExercise, updateWorkoutExercise, removeExerciseFromDay, startSession, getActiveSession, recordSet, removeSet, saveQuickSession, completeSession, abandonSession, updateDailyMetric }), [abandonSession, addExerciseToDay, addWorkoutDay, completeSession, getActiveSession, isRealtimeConnected, lastSyncedAt, recordSet, removeSet, saveQuickSession, refreshFromRemote, removeExerciseFromDay, removeWorkoutDay, reorderWorkoutDays, duplicateWorkoutDay, createWorkoutTemplate, reorderWorkoutExercises, duplicateWorkoutExercise, startSession, state, updateDailyMetric, updateNutrition, updateProfile, updateWorkoutDay, updateWorkoutExercise])

  return <FitnessContext.Provider value={value}>{children}</FitnessContext.Provider>
}

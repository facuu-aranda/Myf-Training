import type {
  AppState,
  CoupleSummary,
  DailyMetric,
  DashboardStats,
  ExerciseSet,
  PersonalRecord,
  WorkoutDay,
  WorkoutSession,
} from '../types'
import { getDateKey, getStartOfWeek } from './utils'

export function calculateVolume(sets: ExerciseSet[]) {
  return sets.reduce((total, set) => total + set.actualWeight * set.actualReps, 0)
}

export function calculateSessionVolume(session: WorkoutSession) {
  return calculateVolume(session.sets)
}

export function calculateCurrentStreak(sessions: WorkoutSession[], today = new Date()) {
  const completedDays = new Set(
    sessions
      .filter((session) => session.status === 'completed')
      .map((session) => getDateKey(new Date(session.finishedAt ?? session.startedAt))),
  )
  let streak = 0
  const cursor = new Date(today)
  cursor.setHours(0, 0, 0, 0)
  while (completedDays.has(getDateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  if (streak === 0) {
    cursor.setDate(cursor.getDate() - 1)
    while (completedDays.has(getDateKey(cursor))) {
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    }
  }
  return streak
}

export function getWeekStartKey(date = new Date()) {
  return getDateKey(getStartOfWeek(date))
}

export function calculateDashboardStats(
  state: AppState,
  userId: string,
  today = new Date(),
): DashboardStats {
  const dateKey = getDateKey(today)
  const weekStart = getStartOfWeek(today).getTime()
  const profile = state.profiles.find((item) => item.id === userId)
  const metric = state.dailyMetrics.find((item) => item.userId === userId && item.date === dateKey)
  const userSessions = state.sessions.filter((session) => session.userId === userId)
  const workoutsThisWeek = userSessions.filter(
    (session) => session.status === 'completed' && new Date(session.finishedAt ?? session.startedAt).getTime() >= weekStart,
  ).length
  const plannedWorkoutsThisWeek = state.workoutDays.filter((day) => day.userId === userId && day.active).length
  return {
    steps: metric?.steps ?? 0,
    stepGoal: profile?.dailyStepGoal ?? 10000,
    calories: metric?.calories ?? 0,
    calorieGoal: profile?.dailyCalorieGoal ?? 2000,
    workoutsThisWeek,
    plannedWorkoutsThisWeek,
    currentStreak: calculateCurrentStreak(userSessions, today),
    totalVolume: calculateVolume(userSessions.flatMap((session) => session.sets)),
  }
}

export function calculateAdherence(completed: number, planned: number) {
  if (planned <= 0) return 0
  return Math.min(100, Math.round((completed / planned) * 100))
}

export function calculatePersonalRecords(sessions: WorkoutSession[], userId: string, exerciseNames: Map<string, string>): PersonalRecord[] {
  const completedSets = sessions.filter((session) => session.userId === userId).flatMap((session) => session.sets)
  const records: PersonalRecord[] = []
  const grouped = new Map<string, ExerciseSet[]>()
  completedSets.forEach((set) => {
    const list = grouped.get(set.exerciseId) ?? []
    list.push(set)
    grouped.set(set.exerciseId, list)
  })
  grouped.forEach((sets, exerciseId) => {
    const name = exerciseNames.get(exerciseId) ?? 'Exercise'
    const heaviest = sets.reduce((best, set) => (set.actualWeight > best.actualWeight ? set : best), sets[0])
    const mostReps = sets.reduce((best, set) => (set.actualReps > best.actualReps ? set : best), sets[0])
    const highestVolume = sets.reduce(
      (best, set) => (set.actualWeight * set.actualReps > best.actualWeight * best.actualReps ? set : best),
      sets[0],
    )
    records.push({
      id: `calculated-weight-${exerciseId}`,
      userId,
      exerciseId,
      recordType: 'weight',
      value: heaviest.actualWeight,
      unit: 'kg',
      achievedAt: heaviest.completedAt,
      label: `${name} · max weight`,
    })
    records.push({
      id: `calculated-reps-${exerciseId}`,
      userId,
      exerciseId,
      recordType: 'reps',
      value: mostReps.actualReps,
      unit: 'reps',
      achievedAt: mostReps.completedAt,
      label: `${name} · max reps`,
    })
    records.push({
      id: `calculated-volume-${exerciseId}`,
      userId,
      exerciseId,
      recordType: 'volume',
      value: highestVolume.actualWeight * highestVolume.actualReps,
      unit: 'kg',
      achievedAt: highestVolume.completedAt,
      label: `${name} · best set`,
    })
  })
  return records.sort((a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime())
}

export function getCoupleSummaries(state: AppState, today = new Date()): CoupleSummary[] {
  return state.profiles.filter((profile) => profile.active).map((profile) => {
    const sessions = state.sessions.filter((session) => session.userId === profile.id && session.status === 'completed')
    const metrics = state.dailyMetrics.filter((metric) => metric.userId === profile.id)
    const weekStart = getStartOfWeek(today).getTime()
    return {
      profile,
      workouts: sessions.length,
      steps: metrics.reduce((total, metric) => total + metric.steps, 0),
      prs: state.personalRecords.filter((record) => record.userId === profile.id).length,
      streak: calculateCurrentStreak(sessions, today),
      weeklyVolume: calculateVolume(
        sessions
          .filter((session) => new Date(session.finishedAt ?? session.startedAt).getTime() >= weekStart)
          .flatMap((session) => session.sets),
      ),
    }
  })
}

export interface ProgressPoint {
  label: string
  volume: number
  workouts: number
  steps: number
  weight: number
  rpe: number
}

export function buildProgressData(
  sessions: WorkoutSession[],
  metrics: DailyMetric[],
  userId: string,
  days: number,
  today = new Date(),
): ProgressPoint[] {
  const points: ProgressPoint[] = []
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today)
    date.setDate(date.getDate() - offset)
    const key = getDateKey(date)
    const daySessions = sessions.filter(
      (session) => session.userId === userId && session.status === 'completed' && getDateKey(new Date(session.finishedAt ?? session.startedAt)) === key,
    )
    const dayMetrics = metrics.filter((metric) => metric.userId === userId && metric.date === key)
    const daySets = daySessions.flatMap((session) => session.sets)
    points.push({
      label: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date),
      volume: calculateVolume(daySets),
      workouts: daySessions.length,
      steps: dayMetrics.reduce((total, metric) => total + metric.steps, 0),
      weight: dayMetrics.at(-1)?.bodyWeight ?? 0,
      rpe: daySets.length ? daySets.reduce((total, set) => total + set.difficulty, 0) / daySets.length : 0,
    })
  }
  return points
}

export function getTodayWorkout(days: WorkoutDay[], today = new Date()) {
  const weekday = today.getDay() === 0 ? 7 : today.getDay()
  return days.find((day) => day.active && day.weekday === weekday) ?? days.find((day) => day.active)
}

export function formatRelativeDate(date: string, now = new Date()) {
  const difference = Math.max(0, now.getTime() - new Date(date).getTime())
  const minutes = Math.floor(difference / 60000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

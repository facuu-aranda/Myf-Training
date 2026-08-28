import { describe, expect, it } from 'vitest'
import { buildProgressData, calculateAdherence, calculateCurrentStreak, calculatePersonalRecords, calculateVolume } from '../src/lib/analytics'
import { getCompletedSetsForPlan, getLiveCompletionPercent, getNextLivePosition } from '../src/lib/live'
import { formatTime, getDateKey } from '../src/lib/utils'
import type { ExerciseSet, WorkoutDay, WorkoutSession } from '../src/types'

const set = (id: string, exerciseId: string, weight: number, reps: number, completedAt = '2026-08-28T10:00:00.000Z'): ExerciseSet => ({ id, sessionId: 'session-1', exerciseId, setNumber: Number(id), plannedWeight: weight, actualWeight: weight, plannedReps: reps, actualReps: reps, difficulty: 7, feeling: 4, painLevel: 0, restSeconds: 60, notes: '', completedAt })

const day: WorkoutDay = { id: 'day-1', userId: 'user-1', name: 'Strength', nameEs: 'Fuerza', description: '', weekday: 1, orderIndex: 0, active: true, estimatedMinutes: 40, exercises: [{ id: 'plan-1', workoutDayId: 'day-1', exerciseId: 'squat', orderIndex: 0, sets: 2, targetReps: 8, targetWeight: 60, restSeconds: 90, notes: '' }, { id: 'plan-2', workoutDayId: 'day-1', exerciseId: 'row', orderIndex: 1, sets: 1, targetReps: 10, targetWeight: 40, restSeconds: 0, notes: '' }], createdAt: '', updatedAt: '' }

describe('fitness analytics', () => {
  it('calculates set volume from actual weight and reps', () => {
    expect(calculateVolume([set('1', 'squat', 60, 8), set('2', 'squat', 65, 6)])).toBe(870)
  })

  it('caps adherence and handles an empty plan', () => {
    expect(calculateAdherence(5, 4)).toBe(100)
    expect(calculateAdherence(1, 0)).toBe(0)
  })

  it('finds a current streak including yesterday when today has no session', () => {
    const sessions = [
      { id: '1', userId: 'user-1', workoutDayId: 'day-1', startedAt: '2026-08-27T10:00:00.000Z', finishedAt: '2026-08-27T11:00:00.000Z', durationSeconds: 3600, overallFeeling: 4, energy: 4, fatigue: 3, mood: 4, difficulty: 7, notes: '', status: 'completed', sets: [] },
      { id: '2', userId: 'user-1', workoutDayId: 'day-1', startedAt: '2026-08-26T10:00:00.000Z', finishedAt: '2026-08-26T11:00:00.000Z', durationSeconds: 3600, overallFeeling: 4, energy: 4, fatigue: 3, mood: 4, difficulty: 7, notes: '', status: 'completed', sets: [] },
    ] satisfies WorkoutSession[]
    expect(calculateCurrentStreak(sessions, new Date('2026-08-28T14:00:00.000Z'))).toBe(2)
  })

  it('builds a point for every selected day', () => {
    const data = buildProgressData([{ id: '1', userId: 'user-1', workoutDayId: 'day-1', startedAt: '2026-08-28T10:00:00.000Z', finishedAt: '2026-08-28T11:00:00.000Z', durationSeconds: 3600, overallFeeling: 4, energy: 4, fatigue: 3, mood: 4, difficulty: 7, notes: '', status: 'completed', sets: [set('1', 'squat', 60, 8)] }], [{ id: 'metric', userId: 'user-1', date: '2026-08-28', steps: 8000, calories: 1800, bodyWeight: 80, notes: '', createdAt: '', updatedAt: '' }], 'user-1', 2, new Date('2026-08-28T14:00:00.000Z'))
    expect(data).toHaveLength(2)
    expect(data[1]).toMatchObject({ volume: 480, workouts: 1, steps: 8000, weight: 80 })
  })

  it('calculates records from logged sets', () => {
    const records = calculatePersonalRecords([{ id: 'session', userId: 'user-1', workoutDayId: 'day-1', startedAt: '', durationSeconds: 0, overallFeeling: 4, energy: 4, fatigue: 3, mood: 4, difficulty: 7, notes: '', status: 'completed', sets: [set('1', 'squat', 60, 8), set('2', 'squat', 70, 6)] }], 'user-1', new Map([['squat', 'Squat']]))
    expect(records.find((record) => record.recordType === 'weight')?.value).toBe(70)
    expect(records.find((record) => record.recordType === 'reps')?.value).toBe(8)
  })
})

describe('live training logic', () => {
  it('moves to the next incomplete set and then exercise', () => {
    expect(getNextLivePosition(day, [set('1', 'squat', 60, 8)])).toEqual({ exerciseIndex: 0, setIndex: 1 })
    expect(getNextLivePosition(day, [set('1', 'squat', 60, 8), set('2', 'squat', 65, 8)])).toEqual({ exerciseIndex: 1, setIndex: 0 })
    expect(getNextLivePosition(day, [set('1', 'squat', 60, 8), set('2', 'squat', 65, 8), set('1', 'row', 40, 10)])).toBeNull()
  })

  it('allocates repeated exercise plans sequentially', () => {
    const repeatedDay: WorkoutDay = { ...day, exercises: [...day.exercises, { ...day.exercises[0], id: 'plan-3', orderIndex: 2, sets: 1 }] }
    const completed = [set('1', 'squat', 60, 8), set('2', 'squat', 65, 8), set('3', 'squat', 67.5, 6)]
    expect(getCompletedSetsForPlan(repeatedDay, 0, completed)).toBe(2)
    expect(getCompletedSetsForPlan(repeatedDay, 2, completed)).toBe(1)
    expect(getNextLivePosition(repeatedDay, completed)).toEqual({ exerciseIndex: 1, setIndex: 0 })
  })

  it('reports progress without exceeding 100 percent', () => {
    expect(getLiveCompletionPercent(day, [])).toBe(0)
    expect(getLiveCompletionPercent(day, [set('1', 'squat', 60, 8), set('2', 'squat', 65, 8), set('1', 'row', 40, 10)])).toBe(100)
  })

  it('formats rest timers consistently', () => {
    expect(formatTime(0)).toBe('00:00')
    expect(formatTime(90)).toBe('01:30')
    expect(formatTime(3661)).toBe('61:01')
  })

  it('uses the local date key for daily data', () => {
    expect(getDateKey(new Date(2026, 7, 28))).toBe('2026-08-28')
  })
})

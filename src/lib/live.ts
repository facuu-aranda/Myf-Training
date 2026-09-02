import type { ExerciseSet, WorkoutDay } from '../types'

export interface LivePosition {
  exerciseIndex: number
  setIndex: number
}

export function getCompletedSetsForPlan(day: WorkoutDay, exerciseIndex: number, completedSets: ExerciseSet[]) {
  const plans = day.exercises.slice().sort((a, b) => a.orderIndex - b.orderIndex)
  const target = plans[exerciseIndex]
  if (!target) return 0
  const totalForExercise = completedSets.filter((set) => set.exerciseId === target.exerciseId).length
  let allocatedToPreviousPlans = 0
  for (let index = 0; index <= exerciseIndex; index += 1) {
    const plan = plans[index]
    if (plan.exerciseId !== target.exerciseId) continue
    const allocated = Math.min(plan.sets, Math.max(0, totalForExercise - allocatedToPreviousPlans))
    if (index === exerciseIndex) return allocated
    allocatedToPreviousPlans += allocated
  }
  return 0
}

export function getNextLivePosition(day: WorkoutDay, completedSets: ExerciseSet[], skippedSetCounts: Record<string, number> = {}): LivePosition | null {
  const plans = day.exercises.slice().sort((a, b) => a.orderIndex - b.orderIndex)
  for (let exerciseIndex = 0; exerciseIndex < plans.length; exerciseIndex += 1) {
    const completedForPlan = getCompletedSetsForPlan(day, exerciseIndex, completedSets)
    const skippedForPlan = Math.max(0, skippedSetCounts[plans[exerciseIndex].id] ?? 0)
    const occupiedSets = completedForPlan + skippedForPlan
    if (occupiedSets < plans[exerciseIndex].sets) return { exerciseIndex, setIndex: occupiedSets }
  }
  return null
}

export function getLiveCompletionPercent(day: WorkoutDay, completedSets: ExerciseSet[]) {
  const total = day.exercises.reduce((sum, plan) => sum + plan.sets, 0)
  return total === 0 ? 0 : Math.round(Math.min(100, completedSets.length / total * 100))
}

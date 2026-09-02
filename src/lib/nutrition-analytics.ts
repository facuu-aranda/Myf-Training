import { addNutrition, calculateDailyNutrition, calculateFoodLogNutrition, calculatePlannedMealNutrition, emptyNutrition, scaleNutrition, type NutritionTotals } from './nutrition'
import type { FoodLog, PlannedMeal } from '../types'

export interface PlannedNutritionRecord {
  date: string
  meal: PlannedMeal
}

export interface NutritionDayComparison {
  date: string
  planned: NutritionTotals
  logged: NutritionTotals
  delta: NutritionTotals
  plannedMealCount: number
  completedMealCount: number
  loggedMealCount: number
  calculableLoggedMealCount: number
}

export function calculateNutritionAdherence(plannedCalories: number, loggedCalories: number) {
  if (plannedCalories === 0 && loggedCalories === 0) return 100
  if (plannedCalories <= 0 || loggedCalories < 0) return null
  return Math.round(Math.min(plannedCalories, loggedCalories) / Math.max(plannedCalories, loggedCalories, 1) * 1000) / 10
}

export function compareNutritionDay(date: string, plannedMeals: PlannedMeal[], foodLogs: FoodLog[]): NutritionDayComparison {
  const planned = calculateDailyNutrition(plannedMeals.map(calculatePlannedMealNutrition))
  const calculableLogged = foodLogs.map(calculateFoodLogNutrition).filter((nutrition): nutrition is NutritionTotals => nutrition !== null)
  const logged = calculateDailyNutrition(calculableLogged)
  return { date, planned, logged, delta: addNutrition(logged, scaleNutrition(planned, -1)), plannedMealCount: plannedMeals.length, completedMealCount: plannedMeals.filter((meal) => meal.status === 'completed' || meal.status === 'logged').length, loggedMealCount: foodLogs.length, calculableLoggedMealCount: calculableLogged.length }
}

export function buildNutritionComparison(dates: string[], planned: PlannedNutritionRecord[], foodLogs: FoodLog[]) {
  const plannedByDate = new Map<string, PlannedMeal[]>()
  planned.forEach((record) => plannedByDate.set(record.date, [...(plannedByDate.get(record.date) ?? []), record.meal]))
  const logsByDate = new Map<string, FoodLog[]>()
  foodLogs.forEach((log) => logsByDate.set(log.consumedOn, [...(logsByDate.get(log.consumedOn) ?? []), log]))
  return dates.map((date) => compareNutritionDay(date, plannedByDate.get(date) ?? [], logsByDate.get(date) ?? []))
}

export function sumNutritionComparison(days: NutritionDayComparison[]) {
  return days.reduce((total, day) => ({ planned: addNutrition(total.planned, day.planned), logged: addNutrition(total.logged, day.logged), delta: addNutrition(total.delta, day.delta), plannedMealCount: total.plannedMealCount + day.plannedMealCount, completedMealCount: total.completedMealCount + day.completedMealCount, loggedMealCount: total.loggedMealCount + day.loggedMealCount, calculableLoggedMealCount: total.calculableLoggedMealCount + day.calculableLoggedMealCount }), { planned: emptyNutrition(), logged: emptyNutrition(), delta: emptyNutrition(), plannedMealCount: 0, completedMealCount: 0, loggedMealCount: 0, calculableLoggedMealCount: 0 })
}

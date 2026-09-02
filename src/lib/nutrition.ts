import type { FoodLog, FoodNutrition, FoodPortion, FoodUnit, NutritionBasis, PlannedMeal } from '../types'

export interface NutritionTotals {
  calories: number
  proteinG: number
  carbohydratesG: number
  fatG: number
  fiberG: number
  saturatedFatG: number
  sugarG: number
  sodiumMg: number
  cholesterolMg: number
}

export interface NutritionItem {
  nutrients: FoodNutrition
  quantity: number
  unit: FoodUnit
  portion?: FoodPortion
}

export interface NormalizedQuantity {
  grams: number | null
  milliliters: number | null
  units: number | null
}

export const emptyNutrition = (): NutritionTotals => ({ calories: 0, proteinG: 0, carbohydratesG: 0, fatG: 0, fiberG: 0, saturatedFatG: 0, sugarG: 0, sodiumMg: 0, cholesterolMg: 0 })

export function addNutrition(left: NutritionTotals, right: NutritionTotals): NutritionTotals {
  return { calories: left.calories + right.calories, proteinG: left.proteinG + right.proteinG, carbohydratesG: left.carbohydratesG + right.carbohydratesG, fatG: left.fatG + right.fatG, fiberG: left.fiberG + right.fiberG, saturatedFatG: left.saturatedFatG + right.saturatedFatG, sugarG: left.sugarG + right.sugarG, sodiumMg: left.sodiumMg + right.sodiumMg, cholesterolMg: left.cholesterolMg + right.cholesterolMg }
}

export function scaleNutrition(value: NutritionTotals, factor: number): NutritionTotals {
  return { calories: value.calories * factor, proteinG: value.proteinG * factor, carbohydratesG: value.carbohydratesG * factor, fatG: value.fatG * factor, fiberG: value.fiberG * factor, saturatedFatG: value.saturatedFatG * factor, sugarG: value.sugarG * factor, sodiumMg: value.sodiumMg * factor, cholesterolMg: value.cholesterolMg * factor }
}

export function normalizeQuantity(quantity: number, unit: FoodUnit, portion?: FoodPortion): NormalizedQuantity {
  if (!Number.isFinite(quantity) || quantity < 0) throw new Error('Quantity must be a non-negative finite number.')
  if (unit === 'g') return { grams: quantity, milliliters: null, units: null }
  if (unit === 'kg') return { grams: quantity * 1000, milliliters: null, units: null }
  if (unit === 'mg') return { grams: quantity / 1000, milliliters: null, units: null }
  if (unit === 'ml') return { grams: null, milliliters: quantity, units: null }
  if (unit === 'l') return { grams: null, milliliters: quantity * 1000, units: null }
  if (portion?.unit === unit) return { grams: portion.grams === null ? null : quantity * portion.grams, milliliters: portion.milliliters === null ? null : quantity * portion.milliliters, units: unit === 'unit' || unit === 'piece' ? quantity : null }
  if (unit === 'unit' || unit === 'piece') return { grams: null, milliliters: null, units: quantity }
  return { grams: null, milliliters: null, units: null }
}

function nutritionFactor(basis: NutritionBasis, normalized: NormalizedQuantity) {
  if (basis === 'per_100g') {
    if (normalized.grams === null) throw new Error('This food needs a gram-based portion for calculation.')
    return normalized.grams / 100
  }
  if (basis === 'per_100ml') {
    if (normalized.milliliters === null) throw new Error('This food needs a milliliter-based portion for calculation.')
    return normalized.milliliters / 100
  }
  if (normalized.units === null) throw new Error('This food needs a unit-based portion for calculation.')
  return normalized.units
}

function requiredNutrient(value: number | null, label: string, factor: number) {
  if (value === null) throw new Error(`This food has no ${label} value for its nutrition basis.`)
  return value * factor
}

function nutritionValues(nutrients: FoodNutrition, factor: number): NutritionTotals {
  return { calories: requiredNutrient(nutrients.calories, 'calories', factor), proteinG: requiredNutrient(nutrients.proteinG, 'protein', factor), carbohydratesG: requiredNutrient(nutrients.carbohydratesG, 'carbohydrates', factor), fatG: requiredNutrient(nutrients.fatG, 'fat', factor), fiberG: requiredNutrient(nutrients.fiberG, 'fiber', factor), saturatedFatG: (nutrients.saturatedFatG ?? 0) * factor, sugarG: (nutrients.sugarG ?? 0) * factor, sodiumMg: (nutrients.sodiumMg ?? 0) * factor, cholesterolMg: (nutrients.cholesterolMg ?? 0) * factor }
}

export function calculateNutrition(nutrients: FoodNutrition, quantity: number, unit: FoodUnit, portion?: FoodPortion): NutritionTotals {
  return nutritionValues(nutrients, nutritionFactor(nutrients.basis, normalizeQuantity(quantity, unit, portion)))
}

export function calculateMealNutrition(items: NutritionItem[]): NutritionTotals {
  return items.reduce((total, item) => addNutrition(total, calculateNutrition(item.nutrients, item.quantity, item.unit, item.portion)), emptyNutrition())
}

export function calculateRecipeNutrition(items: NutritionItem[], servings: number): NutritionTotals {
  if (!Number.isFinite(servings) || servings <= 0) throw new Error('Servings must be greater than zero.')
  return scaleNutrition(calculateMealNutrition(items), 1 / servings)
}

export function calculateDailyNutrition(logs: NutritionTotals[]): NutritionTotals {
  return logs.reduce((total, log) => addNutrition(total, log), emptyNutrition())
}

export function calculateWeeklyNutrition(days: NutritionTotals[]): NutritionTotals {
  return calculateDailyNutrition(days)
}

export function calculatePlannedMealNutrition(meal: PlannedMeal): NutritionTotals {
  return { calories: meal.plannedCalories ?? 0, proteinG: meal.plannedProteinG ?? 0, carbohydratesG: meal.plannedCarbohydratesG ?? 0, fatG: meal.plannedFatG ?? 0, fiberG: meal.plannedFiberG ?? 0, saturatedFatG: 0, sugarG: 0, sodiumMg: 0, cholesterolMg: 0 }
}

export function calculateFoodLogNutrition(log: FoodLog): NutritionTotals | null {
  const totals = log.items.map((item) => {
    if (item.food) {
      const nutrients = item.food.nutrients.find((value) => value.basis === 'per_100g')
      if (!nutrients || !item.foodId) return null
      try { return calculateNutrition(nutrients, item.quantity, item.unit, item.portion) } catch { return null }
    }
    if (item.recipe && item.quantity > 0) {
      const recipeItems = item.recipe.ingredients.flatMap((ingredient) => { const nutrients = ingredient.food?.nutrients.find((value) => value.basis === 'per_100g'); return nutrients ? [{ nutrients, quantity: ingredient.quantity, unit: ingredient.unit, portion: ingredient.portion }] : [] })
      if (recipeItems.length !== item.recipe.ingredients.length || !recipeItems.length) return null
      try { return scaleNutrition(calculateRecipeNutrition(recipeItems, item.recipe.servings), item.quantity) } catch { return null }
    }
    return null
  })
  if (totals.some((total) => total === null) || !totals.length) return null
  return calculateDailyNutrition(totals as NutritionTotals[])
}

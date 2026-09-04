import type { CreateCustomFoodInput } from '../types'

export function validateCustomFoodInput(input: CreateCustomFoodInput): string | null {
  if (!input.name.trim()) return 'name_required'
  if (!Number.isFinite(input.servingSize) || input.servingSize <= 0) return 'serving_size_invalid'
  if (!Number.isFinite(input.calories) || input.calories < 0) return 'calories_invalid'
  const optionalValues = [input.protein, input.carbs, input.fat, input.fiber, input.sugar, input.sodiumMg, input.saturatedFat]
  if (optionalValues.some((value) => value !== null && value !== undefined && (!Number.isFinite(value) || value < 0))) return 'nutrient_invalid'
  return null
}

import { normalizeQuantity } from './nutrition'
import { uid } from './utils'
import type { Food, FoodPortion, GroceryItemCategory, GroceryItemSource, GroceryListItem, GroceryPurchaseUnit, MealPlan, PlannedMeal, Recipe, RecipeIngredient } from '../types'

export interface GroceryIngredientInput {
  food: Food
  quantity: number
  unit: RecipeIngredient['unit']
  portion?: FoodPortion
  normalizedGrams?: number | null
  normalizedMilliliters?: number | null
  source: GroceryItemSource
  sourceId: string
}

interface AggregatedIngredient {
  food: Food
  quantity: number
  unit: GroceryPurchaseUnit
  source: GroceryItemSource
  sourceIds: string[]
}

function categoryForFood(food: Food): GroceryItemCategory {
  const text = `${food.category} ${food.categoryEn} ${food.categoryEs} ${food.foodGroup} ${food.name}`.toLowerCase()
  if (/frut|verd|hort|produce|vegetable|fruit/.test(text)) return 'produce'
  if (/carne|pesc|ovo|protein|meat|fish|seafood|egg|frango|chicken|beef/.test(text)) return 'protein'
  if (/leite|láct|dairy|milk|cheese|iogurte|yogurt/.test(text)) return 'dairy'
  if (/cereal|arroz|massa|pasta|trigo|grain|rice|bread|pão/.test(text)) return 'grains'
  if (/bebida|drink|beverage|suco|juice|water|água/.test(text)) return 'beverages'
  if (/congel|frozen/.test(text)) return 'frozen'
  if (/snack|biscoito|cookie|sweet|doce/.test(text)) return 'snacks'
  return 'pantry'
}

function normalizedIngredient(input: GroceryIngredientInput) {
  if (input.normalizedGrams !== undefined && input.normalizedGrams !== null) return { quantity: input.normalizedGrams, unit: 'g' as const }
  if (input.normalizedMilliliters !== undefined && input.normalizedMilliliters !== null) return { quantity: input.normalizedMilliliters, unit: 'ml' as const }
  const normalized = normalizeQuantity(input.quantity, input.unit, input.portion)
  if (normalized.grams !== null) return { quantity: normalized.grams, unit: 'g' as const }
  if (normalized.milliliters !== null) return { quantity: normalized.milliliters, unit: 'ml' as const }
  if (normalized.units !== null) return { quantity: normalized.units, unit: 'unit' as const }
  return null
}

function sourcePriority(source: GroceryItemSource) { return source === 'recipe-derived' ? 2 : source === 'planned' ? 1 : 0 }

export function recipeIngredientsForMeal(meal: PlannedMeal, recipe?: Recipe): GroceryIngredientInput[] {
  if (!recipe || !meal.servings || meal.servings <= 0) return []
  const scale = meal.servings / recipe.servings
  return recipe.ingredients.flatMap((ingredient) => {
    const quantity = ingredient.quantity * scale
    return ingredient.food ? [{ food: ingredient.food, quantity, unit: ingredient.unit, portion: ingredient.portion, normalizedGrams: ingredient.normalizedGrams === null ? null : ingredient.normalizedGrams * scale, normalizedMilliliters: ingredient.normalizedMilliliters === null ? null : ingredient.normalizedMilliliters * scale, source: 'recipe-derived' as const, sourceId: meal.id }] : []
  })
}

export function ingredientsForMeal(meal: PlannedMeal): GroceryIngredientInput[] {
  if (!meal.food || meal.quantity === null || !meal.unit) return []
  const portion = meal.food.portions.find((item) => item.isDefault) ?? meal.food.portions[0]
  return [{ food: meal.food, quantity: meal.quantity, unit: meal.unit, portion, source: 'planned', sourceId: meal.id }]
}

export function aggregateIngredients(inputs: GroceryIngredientInput[]): GroceryListItem[] {
  const grouped = new Map<string, AggregatedIngredient>()
  inputs.forEach((input) => {
    const normalized = normalizedIngredient(input)
    if (!normalized || normalized.quantity <= 0) return
    const key = `${input.food.id}:${normalized.unit}`
    const current = grouped.get(key)
    if (current) { current.quantity += normalized.quantity; if (sourcePriority(input.source) > sourcePriority(current.source)) current.source = input.source; if (!current.sourceIds.includes(input.sourceId)) current.sourceIds.push(input.sourceId); return }
    grouped.set(key, { food: input.food, quantity: normalized.quantity, unit: normalized.unit, source: input.source, sourceIds: [input.sourceId] })
  })
  return [...grouped.values()].map((item) => {
    const suggested = suggestPurchase(item.quantity, item.unit)
    return { id: uid('grocery-item'), groceryListId: '', foodId: item.food.id, name: item.food.name, nameEs: item.food.nameEs, nameEn: item.food.nameEn, category: categoryForFood(item.food), source: item.source, calculatedQuantity: item.quantity, calculatedUnit: item.unit, manualQuantity: null, manualUnit: null, suggestedQuantity: suggested.quantity, suggestedUnit: suggested.unit, status: 'pending', notes: '', metadata: { source_ids: item.sourceIds }, createdAt: '', updatedAt: '' }
  })
}

export function generateGroceryItems(plans: MealPlan[], recipes: Recipe[] = []): GroceryListItem[] {
  const inputs = plans.flatMap((plan) => plan.days.flatMap((day) => day.meals.flatMap((meal) => { const recipe = meal.recipe ? recipes.find((item) => item.id === meal.recipe?.id) ?? meal.recipe : undefined; return [...ingredientsForMeal(meal), ...recipeIngredientsForMeal(meal, recipe)] })))
  return aggregateIngredients(inputs)
}

export function suggestPurchase(quantity: number, unit: GroceryPurchaseUnit): { quantity: number; unit: GroceryPurchaseUnit } {
  if (unit === 'g') {
    if (quantity >= 1000) return { quantity: Math.ceil(quantity / 1000), unit: 'kg' }
    return { quantity: Math.max(50, Math.ceil(quantity / 50) * 50), unit: 'g' }
  }
  if (unit === 'ml') {
    if (quantity >= 1000) return { quantity: Math.ceil(quantity / 1000), unit: 'l' }
    return { quantity: Math.max(100, Math.ceil(quantity / 100) * 100), unit: 'ml' }
  }
  return { quantity: Math.ceil(quantity), unit }
}

function itemKey(item: GroceryListItem) { return `${item.foodId ?? item.nameEn.toLowerCase()}:${item.calculatedUnit ?? item.manualUnit ?? ''}` }

export function mergeGroceryItems(calculated: GroceryListItem[], existing: GroceryListItem[]): GroceryListItem[] {
  const existingByKey = new Map(existing.map((item) => [itemKey(item), item]))
  const matched = new Set<string>()
  const merged = calculated.map((item) => {
    const previous = existingByKey.get(itemKey(item))
    if (!previous) return item
    matched.add(previous.id)
    return { ...item, id: previous.id, groceryListId: previous.groceryListId, manualQuantity: previous.manualQuantity, manualUnit: previous.manualUnit, status: previous.status, notes: previous.notes, metadata: { ...item.metadata, ...previous.metadata } }
  })
  const preserved = existing.filter((item) => !matched.has(item.id) && (item.source === 'manual' || item.manualQuantity !== null || item.status === 'purchased'))
  return [...merged, ...preserved]
}

export function effectivePurchase(item: GroceryListItem) {
  if (item.manualQuantity !== null && item.manualUnit) return { quantity: item.manualQuantity, unit: item.manualUnit, manual: true }
  if (item.suggestedQuantity !== null && item.suggestedUnit) return { quantity: item.suggestedQuantity, unit: item.suggestedUnit, manual: false }
  return { quantity: item.calculatedQuantity ?? 0, unit: item.calculatedUnit ?? 'unit' as const, manual: false }
}

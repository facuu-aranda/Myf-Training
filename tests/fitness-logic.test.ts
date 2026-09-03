import { describe, expect, it } from 'vitest'
import { buildProgressData, calculateAdherence, calculateCurrentStreak, calculatePersonalRecords, calculateVolume } from '../src/lib/analytics'
import { getCompletedSetsForPlan, getLiveCompletionPercent, getNextLivePosition } from '../src/lib/live'
import { aggregateIngredients, mergeGroceryItems, recipeIngredientsForMeal, suggestPurchase } from '../src/lib/grocery'
import { buildNutritionComparison, calculateNutritionAdherence, compareNutritionDay } from '../src/lib/nutrition-analytics'
import { calculateDailyNutrition, calculateFoodLogNutrition, calculateMealNutrition, calculateNutrition, calculateRecipeNutrition, normalizeQuantity } from '../src/lib/nutrition'
import { formatTime, getDateKey } from '../src/lib/utils'
import type { ExerciseSet, Food, FoodLog, FoodNutrition, FoodPortion, GroceryListItem, PlannedMeal, Recipe, RecipeIngredient, WorkoutDay, WorkoutSession } from '../src/types'

const set = (id: string, exerciseId: string, weight: number, reps: number, completedAt = '2026-08-28T10:00:00.000Z'): ExerciseSet => ({ id, sessionId: 'session-1', exerciseId, setNumber: Number(id), plannedWeight: weight, actualWeight: weight, plannedReps: reps, actualReps: reps, difficulty: 7, feeling: 4, painLevel: 0, restSeconds: 60, notes: '', completedAt })

const day: WorkoutDay = { id: 'day-1', userId: 'user-1', name: 'Strength', nameEs: 'Fuerza', description: '', weekday: 1, orderIndex: 0, active: true, estimatedMinutes: 40, exercises: [{ id: 'plan-1', workoutDayId: 'day-1', exerciseId: 'squat', orderIndex: 0, sets: 2, targetReps: 8, targetWeight: 60, restSeconds: 90, notes: '' }, { id: 'plan-2', workoutDayId: 'day-1', exerciseId: 'row', orderIndex: 1, sets: 1, targetReps: 10, targetWeight: 40, restSeconds: 0, notes: '' }], createdAt: '', updatedAt: '' }

const chickenNutrition: FoodNutrition = { id: 'nutrient-1', foodId: 'chicken', basis: 'per_100g', calories: 165, proteinG: 31, carbohydratesG: 0, fatG: 3.6, fiberG: 0, saturatedFatG: null, sugarG: null, sodiumMg: null, cholesterolMg: null, micronutrients: {}, createdAt: '', updatedAt: '' }
const cupPortion: FoodPortion = { id: 'portion-1', foodId: 'rice', label: '1 cup', unit: 'cup', grams: 185, milliliters: null, isDefault: true, metadata: {}, createdAt: '', updatedAt: '' }
const riceFood: Food = { id: 'rice', sourceId: 'source', externalId: 'rice', name: 'Rice', nameEs: 'Arroz', nameEn: 'Rice', description: 'Rice', category: 'Cereals', categoryEs: 'Cereales', categoryEn: 'Cereals', subcategory: '', subcategoryEs: '', subcategoryEn: '', foodGroup: 'Cereals', brand: '', barcode: '', defaultUnit: 'g', isBasicFood: true, isPackaged: false, metadata: {}, nutrients: [chickenNutrition], portions: [cupPortion], createdAt: '', updatedAt: '' }
const testRecipeIngredient: RecipeIngredient = { id: 'ingredient', recipeId: 'recipe', foodId: riceFood.id, quantity: 200, unit: 'g', normalizedGrams: 200, normalizedMilliliters: null, notes: '', orderIndex: 0, food: riceFood, createdAt: '', updatedAt: '' }
const testRecipe: Recipe = { id: 'recipe', createdBy: null, householdId: null, name: 'Rice', nameEs: 'Arroz', description: '', instructions: '', prepTimeMinutes: 0, cookTimeMinutes: 0, servings: 2, imageUrl: '', visibility: 'private', ingredients: [testRecipeIngredient], createdAt: '', updatedAt: '' }

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

describe('nutrition calculations', () => {
  it('normalizes household portions to grams', () => {
    expect(normalizeQuantity(2, 'cup', cupPortion)).toEqual({ grams: 370, milliliters: null, units: null })
  })

  it('calculates a food and combines meal items', () => {
    expect(calculateNutrition(chickenNutrition, 200, 'g')).toMatchObject({ calories: 330, proteinG: 62, fatG: 7.2 })
    const meal = calculateMealNutrition([{ nutrients: chickenNutrition, quantity: 200, unit: 'g' }, { nutrients: chickenNutrition, quantity: 100, unit: 'g' }])
    expect(meal).toMatchObject({ calories: 495, proteinG: 93 })
    expect(calculateDailyNutrition([meal, calculateNutrition(chickenNutrition, 100, 'g')])).toMatchObject({ calories: 660, proteinG: 124 })
  })

  it('calculates nutrition per serving and rejects invalid servings', () => {
    expect(calculateRecipeNutrition([{ nutrients: chickenNutrition, quantity: 200, unit: 'g' }], 2)).toMatchObject({ calories: 165, proteinG: 31 })
    expect(() => calculateRecipeNutrition([], 0)).toThrow('Servings must be greater than zero.')
  })
})

describe('grocery calculations', () => {
  it('aggregates equivalent food quantities and rounds the purchase suggestion', () => {
    const items = aggregateIngredients([{ food: riceFood, quantity: 700, unit: 'g', source: 'planned', sourceId: 'meal-1' }, { food: riceFood, quantity: 1030, unit: 'g', source: 'planned', sourceId: 'meal-2' }])
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ calculatedQuantity: 1730, calculatedUnit: 'g', suggestedQuantity: 2, suggestedUnit: 'kg' })
    expect(suggestPurchase(1730, 'g')).toEqual({ quantity: 2, unit: 'kg' })
  })

  it('scales recipe ingredients by planned servings', () => {
    const meal = { id: 'meal', mealPlanDayId: 'day', mealType: 'lunch', scheduledTime: null, foodId: null, recipeId: testRecipe.id, quantity: null, unit: null, servings: 3, plannedCalories: 0, plannedProteinG: 0, plannedCarbohydratesG: 0, plannedFatG: 0, plannedFiberG: 0, notes: '', status: 'planned', completedAt: null, loggedAt: null, recipe: testRecipe, createdAt: '', updatedAt: '' } satisfies PlannedMeal
    expect(recipeIngredientsForMeal(meal, testRecipe)[0]).toMatchObject({ quantity: 300, normalizedGrams: 300, source: 'recipe-derived' })
  })

  it('preserves manual quantity and purchased status when regenerating', () => {
    const calculated = aggregateIngredients([{ food: riceFood, quantity: 700, unit: 'g', source: 'planned', sourceId: 'meal-1' }])
    const existing: GroceryListItem = { ...calculated[0], id: 'existing', groceryListId: 'list', manualQuantity: 1, manualUnit: 'kg', status: 'purchased' }
    const merged = mergeGroceryItems(calculated, [existing])
    expect(merged).toHaveLength(1)
    expect(merged[0]).toMatchObject({ id: 'existing', manualQuantity: 1, manualUnit: 'kg', status: 'purchased' })
  })
})

describe('nutrition plan versus actual', () => {
  it('calculates a transparent daily delta and symmetric adherence', () => {
    const planned: PlannedMeal = { id: 'planned', mealPlanDayId: 'day', mealType: 'lunch', scheduledTime: null, foodId: riceFood.id, recipeId: null, quantity: 300, unit: 'g', servings: null, plannedCalories: 495, plannedProteinG: 93, plannedCarbohydratesG: 0, plannedFatG: 10.8, plannedFiberG: 0, notes: '', status: 'completed', completedAt: null, loggedAt: null, food: riceFood, createdAt: '', updatedAt: '' }
    const log: FoodLog = { id: 'log', userId: 'user-1', householdId: null, visibility: 'private', consumedOn: '2026-09-02', consumedAt: '2026-09-02T13:00:00.000Z', mealType: 'lunch', notes: '', items: [{ id: 'item', foodLogId: 'log', foodId: riceFood.id, recipeId: null, quantity: 100, unit: 'g', normalizedGrams: 100, normalizedMilliliters: null, precision: 'exact', notes: '', food: riceFood, createdAt: '', updatedAt: '' }], createdAt: '', updatedAt: '' }
    expect(compareNutritionDay('2026-09-02', [planned], [log])).toMatchObject({ planned: { calories: 495 }, logged: { calories: 165 }, delta: { calories: -330 }, plannedMealCount: 1, completedMealCount: 1, loggedMealCount: 1 })
    expect(buildNutritionComparison(['2026-09-02'], [{ date: '2026-09-02', meal: planned }], [log])).toHaveLength(1)
    expect(calculateNutritionAdherence(15400, 15180)).toBe(98.6)
    const recipeLog: FoodLog = { ...log, id: 'recipe-log', items: [{ id: 'recipe-item', foodLogId: 'recipe-log', foodId: null, recipeId: testRecipe.id, quantity: 1, unit: 'portion', normalizedGrams: null, normalizedMilliliters: null, precision: 'portion', notes: '', recipe: testRecipe, createdAt: '', updatedAt: '' }] }
    expect(calculateFoodLogNutrition(recipeLog)).toMatchObject({ calories: 165, proteinG: 31 })
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

  it('advances past skipped sets without counting them as completed', () => {
    const skippedSetCounts = { 'plan-1': 1 }
    expect(getNextLivePosition(day, [], skippedSetCounts)).toEqual({ exerciseIndex: 0, setIndex: 1 })
    expect(getNextLivePosition(day, [set('1', 'squat', 60, 8)], skippedSetCounts)).toEqual({ exerciseIndex: 1, setIndex: 0 })
    expect(getLiveCompletionPercent(day, [])).toBe(0)
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

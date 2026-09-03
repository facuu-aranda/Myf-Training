import { supabase } from './supabase'
import type { AppState, DailyMetric, Exercise, ExerciseSet, Food, FoodLog, FoodLogItem, FoodLogVisibility, FoodNutrition, FoodPortion, FoodPrecision, FoodSource, GroceryItemCategory, GroceryItemSource, GroceryItemStatus, GroceryList, GroceryListItem, GroceryListStatus, GroceryPurchaseUnit, MealPlan, MealPlanDay, MealPlanVisibility, MealType, NutritionPlan, PersonalRecord, PlannedMeal, PlannedMealStatus, Profile, Recipe, RecipeIngredient, RecipeVisibility, WorkoutDay, WorkoutExercise, WorkoutSession } from '../types'

interface Row { [key: string]: unknown }
const rows = (value: unknown): Row[] => Array.isArray(value) ? value as Row[] : []
const stringValue = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback
const numberValue = (value: unknown, fallback = 0) => typeof value === 'number' ? value : Number(value ?? fallback) || fallback
const booleanValue = (value: unknown, fallback = false) => typeof value === 'boolean' ? value : fallback
const arrayValue = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

function profileFromRow(row: Row): Profile {
  return { id: stringValue(row.id), username: stringValue(row.username), publicHandle: stringValue(row.public_handle), publicCode: stringValue(row.public_code), discoverable: booleanValue(row.discoverable, true), profileVisibility: stringValue(row.profile_visibility, 'discoverable') as Profile['profileVisibility'], progressVisibility: stringValue(row.progress_visibility, 'household') as Profile['progressVisibility'], displayName: stringValue(row.display_name), firstName: stringValue(row.first_name, stringValue(row.display_name).split(' ')[0]), avatarUrl: stringValue(row.avatar_url), heightCm: numberValue(row.height_cm), weightKg: numberValue(row.weight_kg), dailyStepGoal: numberValue(row.daily_step_goal, 10000), dailyCalorieGoal: numberValue(row.daily_calorie_goal, 2000), active: booleanValue(row.active, true), createdAt: stringValue(row.created_at), updatedAt: stringValue(row.updated_at) }
}

export async function loadAuthenticatedProfile(userId: string): Promise<Profile | null> {
  if (!supabase || !userId) return null
  const result = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (result.error) throw result.error
  return result.data ? profileFromRow(result.data as Row) : null
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

function firstRow(value: unknown): Row | undefined {
  if (Array.isArray(value)) return value[0] as Row | undefined
  return value && typeof value === 'object' ? value as Row : undefined
}

function nullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function foodSourceFromRow(row: Row): FoodSource {
  return { id: stringValue(row.id), sourceKey: stringValue(row.source_key), name: stringValue(row.name), sourceUrl: stringValue(row.source_url), license: stringValue(row.license), attribution: stringValue(row.attribution), importedAt: stringValue(row.imported_at), metadata: (row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata) ? row.metadata : {}) as FoodSource['metadata'], createdAt: stringValue(row.created_at), updatedAt: stringValue(row.updated_at) }
}

function foodNutritionFromRow(row: Row): FoodNutrition {
  return { id: stringValue(row.id), foodId: stringValue(row.food_id), basis: stringValue(row.basis, 'per_100g') as FoodNutrition['basis'], calories: nullableNumber(row.calories), proteinG: nullableNumber(row.protein_g), carbohydratesG: nullableNumber(row.carbohydrates_g), fatG: nullableNumber(row.fat_g), fiberG: nullableNumber(row.fiber_g), saturatedFatG: nullableNumber(row.saturated_fat_g), sugarG: nullableNumber(row.sugar_g), sodiumMg: nullableNumber(row.sodium_mg), cholesterolMg: nullableNumber(row.cholesterol_mg), micronutrients: (row.micronutrients && typeof row.micronutrients === 'object' && !Array.isArray(row.micronutrients) ? row.micronutrients : {}) as FoodNutrition['micronutrients'], createdAt: stringValue(row.created_at), updatedAt: stringValue(row.updated_at) }
}

function foodPortionFromRow(row: Row): FoodPortion {
  return { id: stringValue(row.id), foodId: stringValue(row.food_id), label: stringValue(row.label), unit: stringValue(row.unit, 'g') as FoodPortion['unit'], grams: nullableNumber(row.grams), milliliters: nullableNumber(row.ml), isDefault: booleanValue(row.is_default), metadata: (row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata) ? row.metadata : {}) as FoodPortion['metadata'], createdAt: stringValue(row.created_at), updatedAt: stringValue(row.updated_at) }
}

function foodFromRow(row: Row): Food {
  const sourceRow = firstRow(row.food_sources)
  const metadata = (row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata) ? row.metadata : {}) as Food['metadata']
  return { id: stringValue(row.id), sourceId: stringValue(row.source_id), externalId: stringValue(row.external_id), name: stringValue(row.name), nameEs: stringValue(row.name_es, stringValue(row.name)), nameEn: stringValue(row.name_en, stringValue(row.name)), description: stringValue(row.description), category: stringValue(row.category), categoryEs: stringValue(metadata.category_es, stringValue(row.category)), categoryEn: stringValue(metadata.category_en, stringValue(row.category)), subcategory: stringValue(row.subcategory), subcategoryEs: stringValue(metadata.preparation_es, stringValue(row.subcategory)), subcategoryEn: stringValue(metadata.preparation_en, stringValue(row.subcategory)), foodGroup: stringValue(row.food_group), brand: stringValue(row.brand), barcode: stringValue(row.barcode), defaultUnit: stringValue(row.default_unit, 'g') as Food['defaultUnit'], isBasicFood: booleanValue(row.is_basic_food, true), isPackaged: booleanValue(row.is_packaged), metadata, source: sourceRow ? foodSourceFromRow(sourceRow) : undefined, nutrients: rows(row.food_nutrients).map(foodNutritionFromRow), portions: rows(row.food_portions).map(foodPortionFromRow), createdAt: stringValue(row.created_at), updatedAt: stringValue(row.updated_at) }
}

function recipeIngredientFromRow(row: Row): RecipeIngredient {
  const foodRow = firstRow(row.foods)
  const portionRow = firstRow(row.food_portions)
  return { id: stringValue(row.id), recipeId: stringValue(row.recipe_id), foodId: stringValue(row.food_id), foodPortionId: typeof row.food_portion_id === 'string' ? row.food_portion_id : undefined, quantity: numberValue(row.quantity), unit: stringValue(row.unit, 'g') as RecipeIngredient['unit'], normalizedGrams: nullableNumber(row.normalized_grams), normalizedMilliliters: nullableNumber(row.normalized_ml), notes: stringValue(row.notes), orderIndex: numberValue(row.order_index), food: foodRow ? foodFromRow(foodRow) : undefined, portion: portionRow ? foodPortionFromRow(portionRow) : undefined, createdAt: stringValue(row.created_at), updatedAt: stringValue(row.updated_at) }
}

function recipeFromRow(row: Row): Recipe {
  return { id: stringValue(row.id), createdBy: typeof row.created_by === 'string' ? row.created_by : null, householdId: typeof row.household_id === 'string' ? row.household_id : undefined, name: stringValue(row.name), nameEs: stringValue(row.name_es, stringValue(row.name)), description: stringValue(row.description), instructions: stringValue(row.instructions), prepTimeMinutes: numberValue(row.prep_time_minutes), cookTimeMinutes: numberValue(row.cook_time_minutes), servings: numberValue(row.servings, 1), imageUrl: stringValue(row.image_url), visibility: stringValue(row.visibility, 'private') as RecipeVisibility, ingredients: rows(row.recipe_ingredients).map(recipeIngredientFromRow), createdAt: stringValue(row.created_at), updatedAt: stringValue(row.updated_at) }
}

function foodLogItemFromRow(row: Row): FoodLogItem {
  const foodRow = firstRow(row.foods)
  const recipeRow = firstRow(row.recipes)
  const portionRow = firstRow(row.food_portions)
  return { id: stringValue(row.id), foodLogId: stringValue(row.food_log_id), foodId: typeof row.food_id === 'string' ? row.food_id : null, recipeId: typeof row.recipe_id === 'string' ? row.recipe_id : null, foodPortionId: typeof row.food_portion_id === 'string' ? row.food_portion_id : undefined, quantity: numberValue(row.quantity), unit: stringValue(row.unit, 'g') as FoodLogItem['unit'], normalizedGrams: nullableNumber(row.normalized_grams), normalizedMilliliters: nullableNumber(row.normalized_ml), precision: stringValue(row.precision, 'exact') as FoodPrecision, notes: stringValue(row.notes), food: foodRow ? foodFromRow(foodRow) : undefined, recipe: recipeRow ? recipeFromRow(recipeRow) : undefined, portion: portionRow ? foodPortionFromRow(portionRow) : undefined, createdAt: stringValue(row.created_at), updatedAt: stringValue(row.updated_at) }
}

function foodLogFromRow(row: Row): FoodLog {
  return { id: stringValue(row.id), userId: stringValue(row.user_id), householdId: typeof row.household_id === 'string' ? row.household_id : undefined, visibility: stringValue(row.visibility, 'private') as FoodLogVisibility, consumedOn: stringValue(row.consumed_on), consumedAt: stringValue(row.consumed_at), mealType: stringValue(row.meal_type, 'other') as MealType, notes: stringValue(row.notes), items: rows(row.food_log_items).map(foodLogItemFromRow), createdAt: stringValue(row.created_at), updatedAt: stringValue(row.updated_at) }
}

function plannedMealFromRow(row: Row): PlannedMeal {
  const foodRow = firstRow(row.foods)
  const recipeRow = firstRow(row.recipes)
  return { id: stringValue(row.id), mealPlanDayId: stringValue(row.meal_plan_day_id), mealType: stringValue(row.meal_type, 'other') as MealType, scheduledTime: typeof row.scheduled_time === 'string' ? row.scheduled_time : null, foodId: typeof row.food_id === 'string' ? row.food_id : null, recipeId: typeof row.recipe_id === 'string' ? row.recipe_id : null, quantity: nullableNumber(row.quantity), unit: typeof row.unit === 'string' ? row.unit as PlannedMeal['unit'] : null, servings: nullableNumber(row.servings), plannedCalories: nullableNumber(row.planned_calories), plannedProteinG: nullableNumber(row.planned_protein_g), plannedCarbohydratesG: nullableNumber(row.planned_carbohydrates_g), plannedFatG: nullableNumber(row.planned_fat_g), plannedFiberG: nullableNumber(row.planned_fiber_g), notes: stringValue(row.notes), status: stringValue(row.status, 'planned') as PlannedMealStatus, completedAt: typeof row.completed_at === 'string' ? row.completed_at : null, loggedAt: typeof row.logged_at === 'string' ? row.logged_at : null, food: foodRow ? foodFromRow(foodRow) : undefined, recipe: recipeRow ? recipeFromRow(recipeRow) : undefined, createdAt: stringValue(row.created_at), updatedAt: stringValue(row.updated_at) }
}

function mealPlanDayFromRow(row: Row): MealPlanDay {
  return { id: stringValue(row.id), mealPlanId: stringValue(row.meal_plan_id), planDate: stringValue(row.plan_date), notes: stringValue(row.notes), meals: rows(row.planned_meals).map(plannedMealFromRow), createdAt: stringValue(row.created_at), updatedAt: stringValue(row.updated_at) }
}

function mealPlanFromRow(row: Row): MealPlan {
  return { id: stringValue(row.id), userId: stringValue(row.user_id), householdId: typeof row.household_id === 'string' ? row.household_id : undefined, name: stringValue(row.name), startsOn: stringValue(row.starts_on), endsOn: stringValue(row.ends_on), visibility: stringValue(row.visibility, 'private') as MealPlanVisibility, days: rows(row.meal_plan_days).map(mealPlanDayFromRow), createdAt: stringValue(row.created_at), updatedAt: stringValue(row.updated_at) }
}

function groceryItemFromRow(row: Row): GroceryListItem {
  const foodRow = firstRow(row.foods)
  return { id: stringValue(row.id), groceryListId: stringValue(row.grocery_list_id), foodId: typeof row.food_id === 'string' ? row.food_id : null, name: stringValue(row.name), nameEs: stringValue(row.name_es, stringValue(row.name)), nameEn: stringValue(row.name_en, stringValue(row.name)), category: stringValue(row.category, 'other') as GroceryItemCategory, source: stringValue(row.source, 'manual') as GroceryItemSource, calculatedQuantity: nullableNumber(row.calculated_quantity), calculatedUnit: typeof row.calculated_unit === 'string' ? row.calculated_unit as GroceryPurchaseUnit : null, manualQuantity: nullableNumber(row.manual_quantity), manualUnit: typeof row.manual_unit === 'string' ? row.manual_unit as GroceryPurchaseUnit : null, suggestedQuantity: nullableNumber(row.suggested_quantity), suggestedUnit: typeof row.suggested_unit === 'string' ? row.suggested_unit as GroceryPurchaseUnit : null, status: stringValue(row.status, 'pending') as GroceryItemStatus, notes: stringValue(row.notes), metadata: (row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata) ? row.metadata : {}) as GroceryListItem['metadata'], food: foodRow ? foodFromRow(foodRow) : undefined, createdAt: stringValue(row.created_at), updatedAt: stringValue(row.updated_at) }
}

function groceryListFromRow(row: Row): GroceryList {
  return { id: stringValue(row.id), householdId: stringValue(row.household_id), createdBy: typeof row.created_by === 'string' ? row.created_by : null, startsOn: stringValue(row.starts_on), endsOn: stringValue(row.ends_on), status: stringValue(row.status, 'current') as GroceryListStatus, items: rows(row.grocery_list_items).map(groceryItemFromRow), createdAt: stringValue(row.created_at), updatedAt: stringValue(row.updated_at) }
}

const FOOD_SELECT = '*, food_sources(*), food_nutrients(*), food_portions(*)'

export async function loadFoods(options: { search?: string; limit?: number; offset?: number } = {}): Promise<Food[]> {
  if (!supabase) return []
  const limit = Math.min(Math.max(options.limit ?? 60, 1), 100)
  const offset = Math.max(options.offset ?? 0, 0)
  const search = options.search?.trim().replace(/[,%()]/g, ' ') || ''
  const result = await supabase.rpc('search_foods_ranked', { search_term: search, limit_count: limit, offset_count: offset }).select(FOOD_SELECT)
  if (result.error) throw result.error
  return rows(result.data).map(foodFromRow)
}

export async function countFoods(search = ''): Promise<number> {
  if (!supabase) return 0
  let query = supabase.from('foods').select('id', { count: 'exact', head: true })
  const sanitized = search.trim().replace(/[,%()]/g, ' ')
  if (sanitized) {
    const term = `%${sanitized}%`
    query = query.or(`name.ilike.${term},name_es.ilike.${term},name_en.ilike.${term},description.ilike.${term},category.ilike.${term}`)
  }
  const result = await query
  if (result.error) throw result.error
  return result.count ?? 0
}

export async function searchFoods(search: string, limit = 60): Promise<Food[]> {
  return loadFoods({ search, limit })
}

export async function loadFoodFavoriteIds(userId: string): Promise<string[]> {
  if (!supabase || !userId) return []
  const result = await supabase.from('food_favorites').select('food_id').eq('user_id', userId)
  if (result.error) throw result.error
  return rows(result.data).map((row) => stringValue(row.food_id)).filter(Boolean)
}

export async function setFoodFavorite(userId: string, foodId: string, favorite: boolean) {
  if (!supabase) return
  const result = favorite ? await supabase.from('food_favorites').upsert({ user_id: userId, food_id: foodId }, { onConflict: 'user_id,food_id' }) : await supabase.from('food_favorites').delete().eq('user_id', userId).eq('food_id', foodId)
  if (result.error) throw result.error
}

const RECIPE_SELECT = '*, recipe_ingredients(*, foods(*, food_sources(*), food_nutrients(*), food_portions(*)), food_portions(*))'

export async function loadRecipes(): Promise<Recipe[]> {
  if (!supabase) return []
  const result = await supabase.from('recipes').select(RECIPE_SELECT).order('updated_at', { ascending: false })
  if (result.error) throw result.error
  return rows(result.data).map(recipeFromRow)
}

export async function loadUserHouseholdId(userId: string): Promise<string | null> {
  if (!supabase) return null
  const result = await supabase.from('household_members').select('household_id').eq('user_id', userId).maybeSingle()
  if (result.error) return null
  return typeof result.data?.household_id === 'string' ? result.data.household_id : null
}

export async function saveRecipe(recipe: Recipe): Promise<void> {
  if (!supabase) return
  const recipeResult = await supabase.from('recipes').upsert({ id: recipe.id, created_by: recipe.createdBy, household_id: recipe.householdId, name: recipe.name, name_es: recipe.nameEs, description: recipe.description, instructions: recipe.instructions, prep_time_minutes: recipe.prepTimeMinutes, cook_time_minutes: recipe.cookTimeMinutes, servings: recipe.servings, image_url: recipe.imageUrl || null, visibility: recipe.visibility }, { onConflict: 'id' }).select('id').single()
  if (recipeResult.error) throw recipeResult.error
  const deleteResult = await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipe.id)
  if (deleteResult.error) throw deleteResult.error
  const ingredients = recipe.ingredients.map((ingredient) => ({ id: ingredient.id, recipe_id: recipe.id, food_id: ingredient.foodId, food_portion_id: ingredient.foodPortionId ?? null, quantity: ingredient.quantity, unit: ingredient.unit, normalized_grams: ingredient.normalizedGrams, normalized_ml: ingredient.normalizedMilliliters, notes: ingredient.notes, order_index: ingredient.orderIndex }))
  if (!ingredients.length) return
  const ingredientResult = await supabase.from('recipe_ingredients').insert(ingredients)
  if (ingredientResult.error) throw ingredientResult.error
}

export async function deleteRecipe(recipeId: string): Promise<void> {
  if (!supabase) return
  const result = await supabase.from('recipes').delete().eq('id', recipeId)
  if (result.error) throw result.error
}

const FOOD_LOG_SELECT = '*, food_log_items(*, foods(*, food_sources(*), food_nutrients(*), food_portions(*)), recipes(*, recipe_ingredients(*, foods(*, food_sources(*), food_nutrients(*), food_portions(*)), food_portions(*))), food_portions(*))'

export async function loadFoodLogs(userId: string, date?: string): Promise<FoodLog[]> {
  if (!supabase || !userId) return []
  let query = supabase.from('food_logs').select(FOOD_LOG_SELECT).eq('user_id', userId).order('consumed_at', { ascending: false })
  if (date) query = query.eq('consumed_on', date)
  const result = await query
  if (result.error) throw result.error
  return rows(result.data).map(foodLogFromRow)
}

export async function loadFoodLogsInRange(userId: string, startsOn: string, endsOn: string): Promise<FoodLog[]> {
  if (!supabase || !userId) return []
  const result = await supabase.from('food_logs').select(FOOD_LOG_SELECT).eq('user_id', userId).gte('consumed_on', startsOn).lte('consumed_on', endsOn).order('consumed_at', { ascending: true })
  if (result.error) throw result.error
  return rows(result.data).map(foodLogFromRow)
}

export async function loadSharedFoodLogs(householdId: string, startsOn: string, endsOn: string): Promise<FoodLog[]> {
  if (!supabase || !householdId) return []
  const result = await supabase.from('food_logs').select(FOOD_LOG_SELECT).eq('household_id', householdId).eq('visibility', 'household').gte('consumed_on', startsOn).lte('consumed_on', endsOn).order('consumed_at', { ascending: true })
  if (result.error) throw result.error
  return rows(result.data).map(foodLogFromRow)
}

export async function saveFoodLog(log: FoodLog): Promise<void> {
  if (!supabase) return
  const logResult = await supabase.from('food_logs').upsert({ id: log.id, user_id: log.userId, household_id: log.householdId, visibility: log.visibility, consumed_on: log.consumedOn, consumed_at: log.consumedAt, meal_type: log.mealType, notes: log.notes }, { onConflict: 'id' }).select('id').single()
  if (logResult.error) throw logResult.error
  const deleteResult = await supabase.from('food_log_items').delete().eq('food_log_id', log.id)
  if (deleteResult.error) throw deleteResult.error
  const items = log.items.map((item) => ({ id: item.id, food_log_id: log.id, food_id: item.foodId, recipe_id: item.recipeId, food_portion_id: item.foodPortionId ?? null, quantity: item.quantity, unit: item.unit, normalized_grams: item.normalizedGrams, normalized_ml: item.normalizedMilliliters, precision: item.precision, notes: item.notes }))
  if (!items.length) return
  const itemResult = await supabase.from('food_log_items').insert(items)
  if (itemResult.error) throw itemResult.error
}

export async function deleteFoodLog(logId: string): Promise<void> {
  if (!supabase) return
  const result = await supabase.from('food_logs').delete().eq('id', logId)
  if (result.error) throw result.error
}

const MEAL_PLAN_SELECT = '*, meal_plan_days(*, planned_meals(*, foods(*, food_sources(*), food_nutrients(*), food_portions(*)), recipes(*)))'

export async function loadMealPlan(userId: string, startsOn: string, endsOn: string): Promise<MealPlan | null> {
  if (!supabase || !userId) return null
  const result = await supabase.from('meal_plans').select(MEAL_PLAN_SELECT).eq('user_id', userId).eq('starts_on', startsOn).eq('ends_on', endsOn).maybeSingle()
  if (result.error) throw result.error
  return result.data ? mealPlanFromRow(result.data as Row) : null
}

export async function loadMealPlansForUser(userId: string, startsOn: string, endsOn: string): Promise<MealPlan[]> {
  if (!supabase || !userId) return []
  const result = await supabase.from('meal_plans').select(MEAL_PLAN_SELECT).eq('user_id', userId).lte('starts_on', endsOn).gte('ends_on', startsOn)
  if (result.error) throw result.error
  return rows(result.data).map(mealPlanFromRow)
}

export async function saveMealPlan(plan: MealPlan): Promise<void> {
  if (!supabase) return
  const planResult = await supabase.from('meal_plans').upsert({ id: plan.id, user_id: plan.userId, household_id: plan.householdId, name: plan.name, starts_on: plan.startsOn, ends_on: plan.endsOn, visibility: plan.visibility }, { onConflict: 'id' }).select('id').single()
  if (planResult.error) throw planResult.error
  const deleteDays = await supabase.from('meal_plan_days').delete().eq('meal_plan_id', plan.id)
  if (deleteDays.error) throw deleteDays.error
  if (!plan.days.length) return
  const dayRows = plan.days.map((day) => ({ id: day.id, meal_plan_id: plan.id, plan_date: day.planDate, notes: day.notes }))
  const daysResult = await supabase.from('meal_plan_days').insert(dayRows)
  if (daysResult.error) throw daysResult.error
  const mealRows = plan.days.flatMap((day) => day.meals.map((meal) => ({ id: meal.id, meal_plan_day_id: day.id, meal_type: meal.mealType, scheduled_time: meal.scheduledTime, food_id: meal.foodId, recipe_id: meal.recipeId, quantity: meal.quantity, unit: meal.unit, servings: meal.servings, planned_calories: meal.plannedCalories, planned_protein_g: meal.plannedProteinG, planned_carbohydrates_g: meal.plannedCarbohydratesG, planned_fat_g: meal.plannedFatG, planned_fiber_g: meal.plannedFiberG, notes: meal.notes, status: meal.status, completed_at: meal.completedAt, logged_at: meal.loggedAt })))
  if (!mealRows.length) return
  const mealsResult = await supabase.from('planned_meals').insert(mealRows)
  if (mealsResult.error) throw mealsResult.error
}

export async function deleteMealPlan(planId: string): Promise<void> {
  if (!supabase) return
  const result = await supabase.from('meal_plans').delete().eq('id', planId)
  if (result.error) throw result.error
}

const GROCERY_LIST_SELECT = '*, grocery_list_items(*, foods(*, food_sources(*), food_nutrients(*), food_portions(*)))'

export async function loadGroceryList(householdId: string, startsOn: string, endsOn: string): Promise<GroceryList | null> {
  if (!supabase || !householdId) return null
  const result = await supabase.from('grocery_lists').select(GROCERY_LIST_SELECT).eq('household_id', householdId).eq('starts_on', startsOn).eq('ends_on', endsOn).maybeSingle()
  if (result.error) throw result.error
  return result.data ? groceryListFromRow(result.data as Row) : null
}

export async function loadGroceryLists(householdId: string, limit = 12): Promise<GroceryList[]> {
  if (!supabase || !householdId) return []
  const result = await supabase.from('grocery_lists').select('*, grocery_list_items(id)').eq('household_id', householdId).order('starts_on', { ascending: false }).limit(Math.min(Math.max(limit, 1), 50))
  if (result.error) throw result.error
  return rows(result.data).map(groceryListFromRow)
}

export async function loadMealPlansForHousehold(userId: string, householdId: string, startsOn: string, endsOn: string): Promise<MealPlan[]> {
  if (!supabase || !userId || !householdId) return []
  const ownQuery = supabase.from('meal_plans').select(MEAL_PLAN_SELECT).eq('user_id', userId).lte('starts_on', endsOn).gte('ends_on', startsOn)
  const sharedQuery = supabase.from('meal_plans').select(MEAL_PLAN_SELECT).eq('household_id', householdId).eq('visibility', 'household').lte('starts_on', endsOn).gte('ends_on', startsOn)
  const [ownResult, sharedResult] = await Promise.all([ownQuery, sharedQuery])
  if (ownResult.error) throw ownResult.error
  if (sharedResult.error) throw sharedResult.error
  const merged = new Map<string, MealPlan>()
  rows(ownResult.data).map(mealPlanFromRow).forEach((plan) => merged.set(plan.id, plan))
  rows(sharedResult.data).map(mealPlanFromRow).forEach((plan) => merged.set(plan.id, plan))
  return [...merged.values()]
}

export async function saveGroceryList(list: GroceryList): Promise<void> {
  if (!supabase) return
  const listResult = await supabase.from('grocery_lists').upsert({ id: list.id, household_id: list.householdId, created_by: list.createdBy, starts_on: list.startsOn, ends_on: list.endsOn, status: list.status }, { onConflict: 'id' }).select('id').single()
  if (listResult.error) throw listResult.error
  const deleteItems = await supabase.from('grocery_list_items').delete().eq('grocery_list_id', list.id)
  if (deleteItems.error) throw deleteItems.error
  if (!list.items.length) return
  const itemRows = list.items.map((item) => ({ id: item.id, grocery_list_id: list.id, food_id: item.foodId, name: item.name, name_es: item.nameEs, name_en: item.nameEn, category: item.category, source: item.source, calculated_quantity: item.calculatedQuantity, calculated_unit: item.calculatedUnit, manual_quantity: item.manualQuantity, manual_unit: item.manualUnit, suggested_quantity: item.suggestedQuantity, suggested_unit: item.suggestedUnit, status: item.status, notes: item.notes, metadata: item.metadata }))
  const itemResult = await supabase.from('grocery_list_items').insert(itemRows)
  if (itemResult.error) throw itemResult.error
}

export async function deleteGroceryList(listId: string): Promise<void> {
  if (!supabase) return
  const result = await supabase.from('grocery_lists').delete().eq('id', listId)
  if (result.error) throw result.error
}

const EXERCISE_PAGE_SIZE = 1000

async function loadAllExercises(): Promise<Row[]> {
  if (!supabase) return []
  const all: Row[] = []
  for (let from = 0; ; from += EXERCISE_PAGE_SIZE) {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name')
      .range(from, from + EXERCISE_PAGE_SIZE - 1)
    if (error) return []
    const page = rows(data)
    all.push(...page)
    if (page.length < EXERCISE_PAGE_SIZE) return all
  }
}

export async function loadRemoteState(): Promise<AppState | null> {
  if (!supabase) return null
  const [profileResult, nutritionResult, exerciseRows, dayResult, sessionResult, metricResult, recordResult, eventResult] = await Promise.all([
    supabase.from('profiles').select('*'), supabase.from('nutrition_plans').select('*'), loadAllExercises(), supabase.from('workout_days').select('*, workout_exercises(*)').order('order_index'), supabase.from('workout_sessions').select('*, exercise_sets(*)').order('started_at', { ascending: false }), supabase.from('daily_metrics').select('*').order('date', { ascending: false }), supabase.from('personal_records').select('*').order('achieved_at', { ascending: false }), supabase.from('activity_events').select('*').order('created_at', { ascending: false }),
  ])
  if (profileResult.error || !profileResult.data?.length) return null
  const profiles = rows(profileResult.data).map(profileFromRow)
  const nutritionPlans: NutritionPlan[] = rows(nutritionResult.data).map((row) => ({ id: stringValue(row.id), userId: stringValue(row.user_id), calories: numberValue(row.calories, 2000), protein: numberValue(row.protein), carbs: numberValue(row.carbs), fats: numberValue(row.fats), fiber: numberValue(row.fiber), notes: stringValue(row.notes), startsOn: stringValue(row.starts_on), updatedAt: stringValue(row.updated_at) }))
  const exercises = exerciseRows.map(exerciseFromRow)
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

export function persistProfile(profile: Profile) { return save('profiles', { id: profile.id, username: profile.username, public_handle: profile.publicHandle, public_code: profile.publicCode, discoverable: profile.discoverable, profile_visibility: profile.profileVisibility, progress_visibility: profile.progressVisibility, display_name: profile.displayName, first_name: profile.firstName, avatar_url: profile.avatarUrl, height_cm: profile.heightCm, weight_kg: profile.weightKg, daily_step_goal: profile.dailyStepGoal, daily_calorie_goal: profile.dailyCalorieGoal, active: profile.active }) }
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

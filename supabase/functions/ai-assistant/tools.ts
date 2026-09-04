type ToolContext = { client: any; userId: string; date: string }
type ToolDefinition = { type: 'function'; function: { name: string; description: string; parameters: Record<string, unknown> } }

const querySchema = { type: 'object', properties: { query: { type: 'string', minLength: 1, maxLength: 100 } }, required: ['query'], additionalProperties: false }
const impactSchema = { type: 'object', properties: { foodId: { type: 'string', minLength: 1, maxLength: 100 }, quantity: { type: 'number', exclusiveMinimum: 0 }, unit: { type: 'string', enum: ['g', 'kg', 'mg', 'ml', 'l', 'unit', 'cup', 'tablespoon', 'teaspoon', 'slice', 'portion', 'piece'] } }, required: ['foodId', 'quantity', 'unit'], additionalProperties: false }

export const readOnlyTools: ToolDefinition[] = [
  { type: 'function', function: { name: 'get_user_profile', description: 'Get the authenticated user profile and daily targets.', parameters: { type: 'object', properties: {}, additionalProperties: false } } },
  { type: 'function', function: { name: 'get_today_nutrition', description: 'Get the authenticated user nutrition target and today food log summary.', parameters: { type: 'object', properties: {}, additionalProperties: false } } },
  { type: 'function', function: { name: 'get_today_food_log', description: 'Get foods and recipes logged by the authenticated user today.', parameters: { type: 'object', properties: {}, additionalProperties: false } } },
  { type: 'function', function: { name: 'get_today_workout', description: 'Get the authenticated user workout scheduled for today.', parameters: { type: 'object', properties: {}, additionalProperties: false } } },
  { type: 'function', function: { name: 'search_foods', description: 'Search global foods available to the authenticated user. Never invent food IDs.', parameters: querySchema } },
  { type: 'function', function: { name: 'calculate_food_impact', description: 'Calculate nutrition for one real food ID and quantity. Never invent IDs.', parameters: impactSchema } },
  { type: 'function', function: { name: 'search_my_foods', description: 'Search private custom foods owned by the authenticated user. Never access another user custom food.', parameters: querySchema } },
  { type: 'function', function: { name: 'search_exercises', description: 'Search exercises by name, target, muscle group, or equipment.', parameters: querySchema } },
]

export const writeTools: ToolDefinition[] = [
  { type: 'function', function: { name: 'create_custom_food', description: 'Prepare a custom food draft for human confirmation. Never execute it.', parameters: { type: 'object', properties: { name: { type: 'string' }, servingSize: { type: 'number', exclusiveMinimum: 0 }, servingUnit: { type: 'string' }, calories: { type: 'number', minimum: 0 }, protein: { type: 'number', minimum: 0 }, carbs: { type: 'number', minimum: 0 }, fat: { type: 'number', minimum: 0 } }, required: ['name', 'servingSize', 'servingUnit', 'calories'], additionalProperties: false } } },
  { type: 'function', function: { name: 'log_food', description: 'Prepare a food log draft for human confirmation. Never execute it.', parameters: { type: 'object', properties: { foodId: { type: 'string' }, recipeId: { type: 'string' }, quantity: { type: 'number', exclusiveMinimum: 0 }, unit: { type: 'string' }, mealType: { type: 'string' } }, required: ['quantity', 'unit', 'mealType'], additionalProperties: false } } },
  { type: 'function', function: { name: 'add_meal_to_plan', description: 'Prepare a meal plan draft for human confirmation. Never execute it.', parameters: { type: 'object', properties: { foodId: { type: 'string' }, recipeId: { type: 'string' }, planDate: { type: 'string' }, quantity: { type: 'number', exclusiveMinimum: 0 }, unit: { type: 'string' } }, required: ['planDate', 'quantity', 'unit'], additionalProperties: false } } },
  { type: 'function', function: { name: 'create_workout_draft', description: 'Prepare a workout draft for human confirmation using real exercise IDs. Never execute it.', parameters: { type: 'object', properties: { name: { type: 'string' }, weekday: { type: 'number', minimum: 1, maximum: 7 }, estimatedMinutes: { type: 'number', minimum: 1 }, exerciseIds: { type: 'array', items: { type: 'string' }, maxItems: 20 } }, required: ['name', 'weekday', 'exerciseIds'], additionalProperties: false } } },
]

function queryArgument(argumentsValue: unknown) {
  if (!argumentsValue || typeof argumentsValue !== 'object' || typeof (argumentsValue as { query?: unknown }).query !== 'string') throw new Error('invalid_tool_arguments')
  const query = (argumentsValue as { query: string }).query.trim()
  if (!query || query.length > 100) throw new Error('invalid_tool_arguments')
  return query
}

async function getUserProfile({ client, userId }: ToolContext) {
  const result = await client.from('profiles').select('id, display_name, daily_calorie_goal, daily_step_goal, weight_kg, height_cm').eq('id', userId).maybeSingle()
  if (result.error) throw result.error
  return result.data ?? { id: userId }
}

function first(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return value[0] && typeof value[0] === 'object' ? value[0] as Record<string, unknown> : null
  return value && typeof value === 'object' ? value as Record<string, unknown> : null
}

function numberValue(value: unknown) { return typeof value === 'number' && Number.isFinite(value) ? value : null }

function nutritionForFood(food: Record<string, unknown>, quantity: number, unit: string) {
  const nutrients = (Array.isArray(food.food_nutrients) ? food.food_nutrients : []) as Record<string, unknown>[]
  const portions = (Array.isArray(food.food_portions) ? food.food_portions : []) as Record<string, unknown>[]
  const basis = unit === 'ml' || unit === 'l' ? 'per_100ml' : unit === 'unit' || unit === 'piece' ? 'per_unit' : 'per_100g'
  const nutrient = nutrients.find((item) => item.basis === basis)
  if (!nutrient) return null
  const portion = portions.find((item) => item.unit === unit && item.is_default) ?? portions.find((item) => item.unit === unit)
  let factor: number
  if (basis === 'per_100g') {
    const grams = unit === 'g' ? quantity : unit === 'kg' ? quantity * 1000 : unit === 'mg' ? quantity / 1000 : numberValue(portion?.grams) === null ? null : quantity * (numberValue(portion?.grams) as number)
    if (grams === null) return null
    factor = grams / 100
  } else if (basis === 'per_100ml') {
    const milliliters = unit === 'ml' ? quantity : unit === 'l' ? quantity * 1000 : numberValue(portion?.ml) === null ? null : quantity * (numberValue(portion?.ml) as number)
    if (milliliters === null) return null
    factor = milliliters / 100
  } else {
    factor = unit === 'unit' || unit === 'piece' ? quantity : numberValue(portion?.grams) === null && numberValue(portion?.ml) === null ? quantity : quantity
  }
  const required = ['calories', 'protein_g', 'carbohydrates_g', 'fat_g', 'fiber_g']
  if (required.some((key) => numberValue(nutrient[key]) === null)) return null
  return { calories: (nutrient.calories as number) * factor, protein: (nutrient.protein_g as number) * factor, carbs: (nutrient.carbohydrates_g as number) * factor, fat: (nutrient.fat_g as number) * factor, fiber: (nutrient.fiber_g as number) * factor }
}

function summarizeLogs(logs: Record<string, unknown>[]) {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  let calculableItems = 0
  const normalizedLogs = logs.map((log) => {
    const items = (Array.isArray(log.food_log_items) ? log.food_log_items : []) as Record<string, unknown>[]
    const normalizedItems = items.map((item) => {
      const food = first(item.foods)
      const nutrition = food && typeof item.quantity === 'number' && typeof item.unit === 'string' ? nutritionForFood(food, item.quantity, item.unit) : null
      if (nutrition) { totals.calories += nutrition.calories; totals.protein += nutrition.protein; totals.carbs += nutrition.carbs; totals.fat += nutrition.fat; totals.fiber += nutrition.fiber; calculableItems += 1 }
      return { quantity: item.quantity, unit: item.unit, food: food ? { id: food.id, name: food.name, nameEs: food.name_es } : null, recipe: first(item.recipes) }
    })
    return { id: log.id, mealType: log.meal_type, consumedAt: log.consumed_at, notes: log.notes, items: normalizedItems }
  })
  return { logs: normalizedLogs, totals, calculableItems }
}

async function getTodayFoodLog({ client, userId, date }: ToolContext) {
  const result = await client.from('food_logs').select('id, meal_type, consumed_at, notes, food_log_items(quantity, unit, notes, foods(id, name, name_es, food_nutrients(basis, calories, protein_g, carbohydrates_g, fat_g, fiber_g), food_portions(unit, grams, ml, is_default)), recipes(id, name, name_es))').eq('user_id', userId).eq('consumed_on', date).order('consumed_at', { ascending: true })
  if (result.error) throw result.error
  const summary = summarizeLogs((result.data ?? []) as Record<string, unknown>[])
  return { date, ...summary }
}

async function getTodayNutrition(context: ToolContext) {
  const [planResult, log] = await Promise.all([
    context.client.from('nutrition_plans').select('calories, protein, carbs, fats, fiber').eq('user_id', context.userId).order('starts_on', { ascending: false }).limit(1).maybeSingle(),
    getTodayFoodLog(context),
  ])
  if (planResult.error) throw planResult.error
  const target = planResult.data ?? null
  const remaining = target ? { calories: Math.max(0, target.calories - log.totals.calories), protein: Math.max(0, target.protein - log.totals.protein), carbs: Math.max(0, target.carbs - log.totals.carbs), fat: Math.max(0, target.fats - log.totals.fat), fiber: Math.max(0, target.fiber - log.totals.fiber) } : null
  return { date: context.date, target, loggedMeals: log.logs.length, calculableItems: log.calculableItems, totals: log.totals, remaining, foodLog: log.logs }
}

async function getTodayWorkout({ client, userId, date }: ToolContext) {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay() || 7
  const result = await client.from('workout_days').select('id, name, name_es, description, weekday, estimated_minutes, workout_exercises(exercise_id, sets, target_reps, target_seconds, target_weight, rest_seconds, notes)').eq('user_id', userId).eq('weekday', weekday).eq('active', true).maybeSingle()
  if (result.error) throw result.error
  return result.data ?? { planned: false, date }
}

async function calculateFoodImpact({ client }: ToolContext, argumentsValue: unknown) {
  if (!argumentsValue || typeof argumentsValue !== 'object') throw new Error('invalid_tool_arguments')
  const input = argumentsValue as { foodId?: unknown; quantity?: unknown; unit?: unknown }
  if (typeof input.foodId !== 'string' || typeof input.quantity !== 'number' || !Number.isFinite(input.quantity) || input.quantity <= 0 || typeof input.unit !== 'string') throw new Error('invalid_tool_arguments')
  const result = await client.from('foods').select('id, name, name_es, source_type, food_nutrients(basis, calories, protein_g, carbohydrates_g, fat_g, fiber_g), food_portions(unit, grams, ml, is_default)').eq('id', input.foodId).maybeSingle()
  if (result.error) throw result.error
  if (!result.data) return { found: false, foodId: input.foodId }
  const nutrition = nutritionForFood(result.data as Record<string, unknown>, input.quantity, input.unit)
  return { found: true, food: { id: result.data.id, name: result.data.name, nameEs: result.data.name_es, sourceType: result.data.source_type }, quantity: input.quantity, unit: input.unit, nutrition, calculable: Boolean(nutrition) }
}

async function searchFoods({ client }: ToolContext, query: string, scope: 'all' | 'mine') {
  const result = await client.rpc('search_foods_ranked', { search_term: query, limit_count: 10, offset_count: 0, scope_filter: scope })
  if (result.error) throw result.error
  return (result.data ?? []).map((food: Record<string, unknown>) => ({ id: food.id, name: food.name, nameEs: food.name_es, brand: food.brand, sourceType: food.source_type }))
}

async function searchExercises({ client }: ToolContext, query: string) {
  const safeQuery = query.replace(/[,%()]/g, ' ')
  const term = `%${safeQuery}%`
  const result = await client.from('exercises').select('id, name, name_es, muscle_group, target, equipment').or(`name.ilike.${term},name_es.ilike.${term},muscle_group.ilike.${term},target.ilike.${term},equipment.ilike.${term}`).limit(10)
  if (result.error) throw result.error
  return result.data ?? []
}

export function isWriteTool(name: string) {
  return writeTools.some((tool) => tool.function.name === name)
}

export function toolsForScopes(scopes: string[]) {
  const tools = readOnlyTools.filter((tool) => {
    const name = tool.function.name
    if (name === 'get_user_profile') return scopes.includes('profile')
    if (name === 'get_today_nutrition' || name === 'get_today_food_log' || name === 'search_foods' || name === 'calculate_food_impact') return scopes.includes('nutrition_today') || scopes.includes('nutrition_week')
    if (name === 'search_my_foods') return scopes.includes('saved_foods') || scopes.includes('nutrition_today') || scopes.includes('nutrition_week')
    if (name === 'get_today_workout' || name === 'search_exercises') return scopes.includes('workout_today') || scopes.includes('training_week')
    return false
  })
  const nutritionScope = scopes.includes('nutrition_today') || scopes.includes('nutrition_week') || scopes.includes('saved_foods')
  const trainingScope = scopes.includes('workout_today') || scopes.includes('training_week')
  const writable = writeTools.filter((tool) => nutritionScope && ['create_custom_food', 'log_food', 'add_meal_to_plan'].includes(tool.function.name) || trainingScope && tool.function.name === 'create_workout_draft')
  return [...tools, ...writable]
}

export async function executeReadOnlyTool(name: string, argumentsValue: unknown, context: ToolContext) {
  switch (name) {
    case 'get_user_profile': return getUserProfile(context)
    case 'get_today_nutrition': return getTodayNutrition(context)
    case 'get_today_food_log': return getTodayFoodLog(context)
    case 'calculate_food_impact': return calculateFoodImpact(context, argumentsValue)
    case 'get_today_workout': return getTodayWorkout(context)
    case 'search_foods': return searchFoods(context, queryArgument(argumentsValue), 'all')
    case 'search_my_foods': return searchFoods(context, queryArgument(argumentsValue), 'mine')
    case 'search_exercises': return searchExercises(context, queryArgument(argumentsValue))
    default: throw new Error('invalid_tool_arguments')
  }
}

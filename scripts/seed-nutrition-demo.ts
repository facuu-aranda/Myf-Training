import 'dotenv/config'
import { createHash } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { getDateKey, getStartOfWeek } from '../src/lib/utils'

type Row = Record<string, unknown>

interface FoodNutrientRow {
  basis: string
  calories: number | null
  protein_g: number | null
  carbohydrates_g: number | null
  fat_g: number | null
  fiber_g: number | null
}

interface FoodPortionRow {
  id: string
  is_default: boolean
}

interface FoodRow {
  id: string
  name: string
  name_es: string
  name_en: string | null
  category: string
  food_group: string
  food_nutrients: FoodNutrientRow[]
  food_portions: FoodPortionRow[]
}

interface NutritionValues {
  calories: number
  proteinG: number
  carbohydratesG: number
  fatG: number
  fiberG: number
}

interface RecipeDefinition {
  key: string
  name: string
  nameEs: string
  description: string
  instructions: string
  servings: number
  ingredients: Array<{ foodKey: string; quantity: number }>
}

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceRoleKey) throw new Error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running yarn seed:nutrition:demo.')

const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
const coupleId = '11111111-1111-4111-8111-111111111111'
const demoDate = process.env.DEMO_SEED_DATE ?? getDateKey(new Date())
const demoDateObject = new Date(`${demoDate}T12:00:00`)
const weekStart = getStartOfWeek(demoDateObject)
const startsOn = getDateKey(weekStart)
const endsOn = getDateKey(new Date(weekStart.getTime() + 6 * 86400000))
const currentDayIndex = Math.max(0, Math.min(6, Math.round((demoDateObject.getTime() - weekStart.getTime()) / 86400000)))

function stableUuid(value: string) {
  const hex = createHash('sha256').update(value).digest('hex').slice(0, 32).split('')
  hex[12] = '5'
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16)
  return `${hex.slice(0, 8).join('')}-${hex.slice(8, 12).join('')}-${hex.slice(12, 16).join('')}-${hex.slice(16, 20).join('')}-${hex.slice(20).join('')}`
}

function addDays(date: Date, amount: number) {
  return new Date(date.getTime() + amount * 86400000)
}

function value(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function emptyNutrition(): NutritionValues { return { calories: 0, proteinG: 0, carbohydratesG: 0, fatG: 0, fiberG: 0 } }
function addNutrition(left: NutritionValues, right: NutritionValues): NutritionValues { return { calories: left.calories + right.calories, proteinG: left.proteinG + right.proteinG, carbohydratesG: left.carbohydratesG + right.carbohydratesG, fatG: left.fatG + right.fatG, fiberG: left.fiberG + right.fiberG } }
function scaleNutrition(nutrition: NutritionValues, factor: number): NutritionValues { return { calories: nutrition.calories * factor, proteinG: nutrition.proteinG * factor, carbohydratesG: nutrition.carbohydratesG * factor, fatG: nutrition.fatG * factor, fiberG: nutrition.fiberG * factor } }

async function upsertDemoRows(table: string, rows: Row[]) {
  if (!rows.length) return 0
  const result = await admin.from(table).upsert(rows, { onConflict: 'id' })
  if (result.error) throw result.error
  return rows.length
}

async function listUsers() {
  const result = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (result.error) throw result.error
  const users = { fabricio: result.data.users.find((user) => user.email === 'fabricio@train-together.local'), maria: result.data.users.find((user) => user.email === 'maria@train-together.local') }
  if (!users.fabricio || !users.maria) throw new Error('Both demo users must exist. Run yarn seed first.')
  return { fabricio: users.fabricio.id, maria: users.maria.id }
}

async function findFoods() {
  const select = 'id, name, name_es, name_en, category, food_group, food_nutrients(*), food_portions(*)'
  const definitions: Record<string, { terms: string[]; preferred: string[]; excluded: string[] }> = {
    chicken: { terms: ['chicken breast', 'pechuga de pollo', 'chicken'], preferred: ['skinless, boneless', 'breast'], excluded: ['breaded', 'tender', 'ground', 'fried'] },
    rice: { terms: ['rice, white', 'arroz blanco', 'rice'], preferred: ['rice, white, long-grain', 'long-grain', 'white rice'], excluded: ['flour', 'fried', 'restaurant', 'puffed'] },
    oats: { terms: ['oatmeal', 'oats', 'avena'], preferred: ['oatmeal, regular', 'oats, whole grain'], excluded: ['cookie', 'cookies', 'bread', 'flour'] },
    yogurt: { terms: ['yogurt, greek, plain', 'yogurt'], preferred: ['greek, plain', 'plain'], excluded: ['flavored', 'strawberry', 'vanilla'] },
    banana: { terms: ['bananas, ripe', 'banana'], preferred: ['ripe and slightly ripe'], excluded: ['overripe', 'chips', 'flour'] },
    tomato: { terms: ['tomatoes, grape', 'tomato'], preferred: ['grape, raw', 'roma'], excluded: ['canned', 'sauce', 'juice'] },
    oliveOil: { terms: ['olive oil, extra virgin', 'olive oil'], preferred: ['extra virgin'], excluded: ['palm', 'canola', 'soybean'] },
    salmon: { terms: ['salmon, atlantic', 'salmon'], preferred: ['atlantic, farm raised, raw', 'atlantic'], excluded: ['canned', 'smoked', 'kippered'] },
    potato: { terms: ['potatoes, russet', 'potato'], preferred: ['russet, without skin, raw', 'russet'], excluded: ['flour', 'chips', 'fried'] },
    avocado: { terms: ['avocado, hass', 'avocado'], preferred: ['hass, peeled, raw', 'hass'], excluded: ['oil', 'dressing'] },
    peanutButter: { terms: ['peanut butter, creamy', 'peanut butter'], preferred: ['creamy'], excluded: ['powder', 'cookie', 'candy'] },
    broccoli: { terms: ['broccoli, raw', 'broccoli'], preferred: ['raw'], excluded: ['soup', 'cheese', 'frozen'] },
  }
  const foods: Record<string, FoodRow> = {}
  for (const [key, definition] of Object.entries(definitions)) {
    const candidates = new Map<string, FoodRow>()
    for (const term of definition.terms) {
      const sanitized = term.replace(/[,%()]/g, ' ')
      const result = await admin.from('foods').select(select).or(`name.ilike.%${sanitized}%,name_es.ilike.%${sanitized}%,name_en.ilike.%${sanitized}%`).limit(50)
      if (result.error) throw result.error
      ;(result.data as FoodRow[] | null)?.forEach((food) => candidates.set(food.id, food))
    }
    const score = (food: FoodRow) => {
      const text = `${food.name} ${food.name_es} ${food.name_en ?? ''}`.toLowerCase()
      return definition.preferred.reduce((total, term) => total + (text.includes(term.toLowerCase()) ? 1000 : 0), 0) + definition.terms.reduce((total, term, index) => total + (text.includes(term.toLowerCase()) ? 100 - index : 0), 0)
    }
    const ranked = [...candidates.values()].sort((left, right) => score(right) - score(left))
    const usable = ranked.filter((food) => { const text = `${food.name} ${food.name_es} ${food.name_en ?? ''}`.toLowerCase(); return !definition.excluded.some((term) => text.includes(term.toLowerCase())) })
    const selected = usable[0] ?? ranked[0]
    if (!selected) throw new Error(`Could not find an imported food for demo key: ${key}`)
    foods[key] = selected
    console.log(`Food ${key}: ${selected.name_en ?? selected.name}`)
  }
  return foods
}

function foodNutrition(food: FoodRow, quantity: number): NutritionValues {
  const nutrient = food.food_nutrients.find((row) => row.basis === 'per_100g')
  if (!nutrient) return emptyNutrition()
  const factor = quantity / 100
  return { calories: value(nutrient.calories) * factor, proteinG: value(nutrient.protein_g) * factor, carbohydratesG: value(nutrient.carbohydrates_g) * factor, fatG: value(nutrient.fat_g) * factor, fiberG: value(nutrient.fiber_g) * factor }
}

function defaultPortion(food: FoodRow) { return food.food_portions.find((portion) => portion.is_default)?.id ?? food.food_portions[0]?.id ?? null }

const recipeDefinitions: RecipeDefinition[] = [
  { key: 'overnight-oats', name: 'Overnight Oats', nameEs: 'Avena nocturna', description: 'A simple high-protein breakfast prepared the night before.', instructions: 'Mix the oats, yogurt and peanut butter. Add banana before serving and chill overnight.', servings: 1, ingredients: [{ foodKey: 'oats', quantity: 60 }, { foodKey: 'yogurt', quantity: 150 }, { foodKey: 'banana', quantity: 80 }, { foodKey: 'peanutButter', quantity: 15 }] },
  { key: 'chicken-rice-bowl', name: 'Chicken Rice Bowl', nameEs: 'Bowl de pollo y arroz', description: 'A balanced bowl for training days.', instructions: 'Cook the rice and chicken. Serve with tomato, avocado and olive oil.', servings: 2, ingredients: [{ foodKey: 'chicken', quantity: 300 }, { foodKey: 'rice', quantity: 300 }, { foodKey: 'tomato', quantity: 100 }, { foodKey: 'avocado', quantity: 80 }, { foodKey: 'oliveOil', quantity: 10 }] },
  { key: 'salmon-potato-plate', name: 'Salmon Potato Plate', nameEs: 'Plato de salmón y papa', description: 'A calm dinner with fish, vegetables and a simple carbohydrate.', instructions: 'Bake the salmon and potato. Steam the broccoli and finish with olive oil.', servings: 2, ingredients: [{ foodKey: 'salmon', quantity: 300 }, { foodKey: 'potato', quantity: 400 }, { foodKey: 'broccoli', quantity: 200 }, { foodKey: 'oliveOil', quantity: 10 }] },
]

function recipeNutrition(recipe: RecipeDefinition, foods: Record<string, FoodRow>) {
  return scaleNutrition(recipe.ingredients.reduce((total, ingredient) => addNutrition(total, foodNutrition(foods[ingredient.foodKey], ingredient.quantity)), emptyNutrition()), 1 / recipe.servings)
}

async function seedRecipes(userIds: Record<'fabricio' | 'maria', string>, foods: Record<string, FoodRow>) {
  const recipes = recipeDefinitions.map((recipe) => ({ id: stableUuid(`nutrition-demo:recipe:${recipe.key}`), created_by: userIds.fabricio, couple_id: coupleId, name: recipe.name, name_es: recipe.nameEs, description: recipe.description, instructions: recipe.instructions, prep_time_minutes: 10, cook_time_minutes: 20, servings: recipe.servings, image_url: null, visibility: 'household' }))
  const recipeCount = await upsertDemoRows('recipes', recipes)
  const ingredients = recipeDefinitions.flatMap((recipe) => recipe.ingredients.map((ingredient, index) => ({ id: stableUuid(`nutrition-demo:recipe-ingredient:${recipe.key}:${index}`), recipe_id: stableUuid(`nutrition-demo:recipe:${recipe.key}`), food_id: foods[ingredient.foodKey].id, food_portion_id: defaultPortion(foods[ingredient.foodKey]), quantity: ingredient.quantity, unit: 'g', normalized_grams: ingredient.quantity, normalized_ml: null, notes: '', order_index: index })))
  const ingredientCount = await upsertDemoRows('recipe_ingredients', ingredients)
  return { recipes, recipeCount, ingredientCount }
}

function recipeId(key: string) { return stableUuid(`nutrition-demo:recipe:${key}`) }
function recipeByKey(key: string) { const recipe = recipeDefinitions.find((item) => item.key === key); if (!recipe) throw new Error(`Unknown demo recipe: ${key}`); return recipe }

async function seedMealPlans(userIds: Record<'fabricio' | 'maria', string>, foods: Record<string, FoodRow>) {
  const planRows: Row[] = []
  const dayRows: Row[] = []
  const mealRows: Row[] = []
  const userConfig = { fabricio: { banana: 130, breakfast: 1, lunch: 1, dinner: 1 }, maria: { banana: 100, breakfast: 0.9, lunch: 0.8, dinner: 0.8 } }
  for (const username of ['fabricio', 'maria'] as const) {
    const planId = stableUuid(`nutrition-demo:meal-plan:${username}:${startsOn}`)
    planRows.push({ id: planId, user_id: userIds[username], couple_id: coupleId, name: `Demo week · ${username}`, starts_on: startsOn, ends_on: endsOn, visibility: 'private' })
    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const date = getDateKey(addDays(weekStart, dayIndex))
      const dayId = stableUuid(`nutrition-demo:meal-plan-day:${username}:${date}`)
      dayRows.push({ id: dayId, meal_plan_id: planId, plan_date: date, notes: dayIndex === 2 ? 'Midweek adjustment: keep hydration visible.' : '' })
      const config = userConfig[username]
      const meals = [
        { key: 'breakfast', mealType: 'breakfast', time: '08:00', recipe: 'overnight-oats', servings: config.breakfast },
        { key: 'lunch', mealType: 'lunch', time: '13:00', recipe: 'chicken-rice-bowl', servings: config.lunch },
        { key: 'snack', mealType: 'snack', time: '17:00', food: 'banana', quantity: config.banana },
        { key: 'dinner', mealType: 'dinner', time: '20:30', recipe: 'salmon-potato-plate', servings: config.dinner },
      ]
      meals.forEach((meal) => {
        const id = stableUuid(`nutrition-demo:planned-meal:${username}:${date}:${meal.key}`)
        const status = dayIndex < currentDayIndex ? 'completed' : 'planned'
        const nutrition = meal.recipe ? scaleNutrition(recipeNutrition(recipeByKey(meal.recipe), foods), meal.servings ?? 1) : foodNutrition(foods[meal.food ?? ''], meal.quantity ?? 0)
        mealRows.push({ id, meal_plan_day_id: dayId, meal_type: meal.mealType, scheduled_time: meal.time, food_id: meal.food ? foods[meal.food].id : null, recipe_id: meal.recipe ? recipeId(meal.recipe) : null, quantity: meal.food ? meal.quantity : null, unit: meal.food ? 'g' : null, servings: meal.recipe ? meal.servings : null, planned_calories: Number(nutrition.calories.toFixed(2)), planned_protein_g: Number(nutrition.proteinG.toFixed(2)), planned_carbohydrates_g: Number(nutrition.carbohydratesG.toFixed(2)), planned_fat_g: Number(nutrition.fatG.toFixed(2)), planned_fiber_g: Number(nutrition.fiberG.toFixed(2)), notes: '', status, completed_at: status === 'completed' ? `${date}T${meal.time}:00.000Z` : null, logged_at: null })
      })
    }
  }
  const plansAdded = await upsertDemoRows('meal_plans', planRows)
  const daysAdded = await upsertDemoRows('meal_plan_days', dayRows)
  const mealsAdded = await upsertDemoRows('planned_meals', mealRows)
  return { plansAdded, daysAdded, mealsAdded }
}

async function seedFoodLogs(userIds: Record<'fabricio' | 'maria', string>, foods: Record<string, FoodRow>) {
  const logs: Row[] = []
  const items: Row[] = []
  const logDays = currentDayIndex + 1
  const userConfig = { fabricio: { breakfast: 1, lunch: 1, snack: 130, dinner: 1 }, maria: { breakfast: 0.9, lunch: 0.8, snack: 100, dinner: 0.8 } }
  for (const username of ['fabricio', 'maria'] as const) {
    for (let dayIndex = 0; dayIndex < logDays; dayIndex += 1) {
      const date = getDateKey(addDays(weekStart, dayIndex))
      const config = userConfig[username]
      const mealDefinitions = [
        { key: 'breakfast', mealType: 'breakfast', time: '08:05', recipe: 'overnight-oats', quantity: config.breakfast },
        { key: 'lunch', mealType: 'lunch', time: '13:15', recipe: 'chicken-rice-bowl', quantity: config.lunch },
        { key: 'snack', mealType: 'snack', time: '17:10', food: 'banana', quantity: config.snack },
        { key: 'dinner', mealType: 'dinner', time: '20:35', recipe: 'salmon-potato-plate', quantity: config.dinner },
      ]
      mealDefinitions.forEach((meal) => {
        const logId = stableUuid(`nutrition-demo:food-log:${username}:${date}:${meal.key}`)
        const visibility = meal.key === 'dinner' && dayIndex % 2 === 1 ? 'private' : 'household'
        logs.push({ id: logId, user_id: userIds[username], couple_id: coupleId, visibility, consumed_on: date, consumed_at: `${date}T${meal.time}:00.000Z`, meal_type: meal.mealType, notes: 'Demo seed · adjust this meal to match the real day.' })
        items.push({ id: stableUuid(`nutrition-demo:food-log-item:${username}:${date}:${meal.key}`), food_log_id: logId, food_id: meal.food ? foods[meal.food].id : null, recipe_id: meal.recipe ? recipeId(meal.recipe) : null, food_portion_id: meal.food ? defaultPortion(foods[meal.food]) : null, quantity: meal.quantity, unit: meal.food ? 'g' : 'portion', normalized_grams: meal.food ? meal.quantity : null, normalized_ml: null, precision: meal.food ? 'exact' : 'portion', notes: '' })
      })
    }
  }
  const logsAdded = await upsertDemoRows('food_logs', logs)
  const itemsAdded = await upsertDemoRows('food_log_items', items)
  return { logsAdded, itemsAdded }
}

async function seedFavorites(userIds: Record<'fabricio' | 'maria', string>, foods: Record<string, FoodRow>) {
  const favorites = (['chicken', 'oats', 'banana', 'avocado'] as const).flatMap((foodKey) => Object.values(userIds).map((userId) => ({ user_id: userId, food_id: foods[foodKey].id })))
  const result = await admin.from('food_favorites').upsert(favorites, { onConflict: 'user_id,food_id' })
  if (result.error) throw result.error
  return favorites.length
}

async function seedGrocery(userIds: Record<'fabricio' | 'maria', string>, foods: Record<string, FoodRow>) {
  const existingList = await admin.from('grocery_lists').select('id').eq('couple_id', coupleId).eq('starts_on', startsOn).eq('ends_on', endsOn).maybeSingle()
  if (existingList.error) throw existingList.error
  const listId = typeof existingList.data?.id === 'string' ? existingList.data.id : stableUuid(`nutrition-demo:grocery-list:${startsOn}`)
  const listAdded = existingList.data ? 0 : await upsertDemoRows('grocery_lists', [{ id: listId, couple_id: coupleId, created_by: userIds.fabricio, starts_on: startsOn, ends_on: endsOn, status: 'current' }])
  const definitions: Array<{ key: string; calculated: number; suggested: number; category: string; source: string }> = [
    { key: 'chicken', calculated: 2400, suggested: 3, category: 'protein', source: 'recipe-derived' },
    { key: 'rice', calculated: 1800, suggested: 2, category: 'grains', source: 'recipe-derived' },
    { key: 'oats', calculated: 840, suggested: 1, category: 'grains', source: 'recipe-derived' },
    { key: 'banana', calculated: 1610, suggested: 2, category: 'produce', source: 'planned' },
    { key: 'yogurt', calculated: 2100, suggested: 2, category: 'dairy', source: 'recipe-derived' },
    { key: 'tomato', calculated: 700, suggested: 1, category: 'produce', source: 'recipe-derived' },
    { key: 'salmon', calculated: 1200, suggested: 2, category: 'protein', source: 'recipe-derived' },
    { key: 'broccoli', calculated: 800, suggested: 1, category: 'produce', source: 'recipe-derived' },
  ]
  const itemRows = definitions.map((item) => ({ id: stableUuid(`nutrition-demo:grocery-item:${startsOn}:${item.key}`), grocery_list_id: listId, food_id: foods[item.key].id, name: foods[item.key].name, name_es: foods[item.key].name_es, name_en: foods[item.key].name_en ?? foods[item.key].name, category: item.category, source: item.source, calculated_quantity: item.calculated, calculated_unit: 'g', manual_quantity: null, manual_unit: null, suggested_quantity: item.suggested, suggested_unit: 'kg', status: 'pending', notes: '', metadata: { demo: true, source: 'nutrition-demo-seed' } }))
  const itemsAdded = await upsertDemoRows('grocery_list_items', itemRows)
  return { listAdded, itemsAdded }
}

async function seed() {
  const userIds = await listUsers()
  const foods = await findFoods()
  const recipes = await seedRecipes(userIds, foods)
  const plans = await seedMealPlans(userIds, foods)
  const logs = await seedFoodLogs(userIds, foods)
  const favorites = await seedFavorites(userIds, foods)
  const grocery = await seedGrocery(userIds, foods)
  console.log(JSON.stringify({ demoDate, period: { startsOn, endsOn }, users: 2, recipes, plans, logs, favorites, grocery }, null, 2))
}

void seed().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1 })

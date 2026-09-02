import 'dotenv/config'
import AdmZip from 'adm-zip'
import { createClient } from '@supabase/supabase-js'

type JsonRecord = Record<string, unknown>
type UsdaFood = JsonRecord

interface DatasetConfig {
  key: string
  rootKey: string
  name: string
  url: string
  attribution: string
}

interface ParsedFood {
  externalId: string
  name: string
  nameEs: string
  nameEn: string
  category: string
  categoryEs: string
  categoryEn: string
  nutrients: JsonRecord
  portions: JsonRecord[]
}

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceRoleKey) throw new Error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running yarn seed:foods:usda.')

const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
const datasets: DatasetConfig[] = [
  { key: 'usda-foundation-2026-04', rootKey: 'FoundationFoods', name: 'USDA FoodData Central — Foundation Foods (April 2026)', url: 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_json_2026-04-30.zip', attribution: 'U.S. Department of Agriculture, Agricultural Research Service, FoodData Central. Foundation Foods, April 2026. CC0 1.0.' },
  { key: 'usda-sr-legacy-2018-04', rootKey: 'SRLegacyFoods', name: 'USDA FoodData Central — SR Legacy (April 2018)', url: 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_json_2018-04.zip', attribution: 'U.S. Department of Agriculture, Agricultural Research Service, FoodData Central. SR Legacy, April 2018. CC0 1.0.' },
]
const selectedKeys = new Set((process.env.USDA_DATASETS ?? datasets.map((dataset) => dataset.key).join(',')).split(',').map((value) => value.trim()).filter(Boolean))
const chunkSize = 200
const translationBatchSize = 35
const translationConcurrency = 4

function record(value: unknown): JsonRecord { return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {} }
function text(value: unknown) { return typeof value === 'string' ? value.trim() : '' }
function numeric(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string' || !value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
function positiveNumber(value: unknown) { const parsed = numeric(value); return parsed !== null && parsed >= 0 ? parsed : null }
function slug(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') }

async function fetchDataset(dataset: DatasetConfig): Promise<UsdaFood[]> {
  const response = await fetch(dataset.url)
  if (!response.ok) throw new Error(`Could not download ${dataset.name} (${response.status} ${response.statusText}).`)
  const zip = new AdmZip(Buffer.from(await response.arrayBuffer()))
  const entry = zip.getEntries().find((item) => !item.isDirectory && item.entryName.toLowerCase().endsWith('.json'))
  if (!entry) throw new Error(`No JSON file found in ${dataset.name}.`)
  const payload = record(JSON.parse(entry.getData().toString('utf8')))
  const foods = payload[dataset.rootKey]
  if (!Array.isArray(foods)) throw new Error(`${dataset.name} does not contain the expected ${dataset.rootKey} array.`)
  return foods.map(record)
}

function nutrientAmount(food: UsdaFood, predicate: (name: string, unit: string) => boolean) {
  const nutrients = Array.isArray(food.foodNutrients) ? food.foodNutrients : []
  for (const raw of nutrients) {
    const item = record(raw)
    const nutrient = record(item.nutrient)
    const name = text(nutrient.name).toLowerCase()
    const unit = text(nutrient.unitName).toLowerCase()
    if (!predicate(name, unit)) continue
    const amount = positiveNumber(item.amount ?? item.median)
    if (amount !== null) return amount
  }
  return null
}

function coreNutrients(food: UsdaFood) {
  const calories = nutrientAmount(food, (name, unit) => name === 'energy' && unit === 'kcal' || name.includes('energy') && unit === 'kcal')
  const micronutrients: JsonRecord = {}
  const rawNutrients = Array.isArray(food.foodNutrients) ? food.foodNutrients : []
  rawNutrients.forEach((raw) => {
    const item = record(raw)
    const nutrient = record(item.nutrient)
    const name = text(nutrient.name)
    const amount = positiveNumber(item.amount ?? item.median)
    if (name && amount !== null) micronutrients[slug(name)] = amount
  })
  return {
    calories,
    protein_g: nutrientAmount(food, (name) => name === 'protein'),
    carbohydrates_g: nutrientAmount(food, (name) => name.startsWith('carbohydrate')),
    fat_g: nutrientAmount(food, (name) => name === 'total lipid (fat)' || name === 'fat'),
    fiber_g: nutrientAmount(food, (name) => name.includes('fiber, total dietary')),
    saturated_fat_g: nutrientAmount(food, (name) => name.includes('fatty acids, total saturated')),
    sugar_g: nutrientAmount(food, (name) => name.startsWith('sugars, total')),
    sodium_mg: nutrientAmount(food, (name, unit) => name === 'sodium, na' && unit === 'mg'),
    cholesterol_mg: nutrientAmount(food, (name, unit) => name === 'cholesterol' && unit === 'mg'),
    micronutrients,
  }
}

function portionUnit(value: string) {
  const normalized = value.toLowerCase()
  if (normalized.includes('gram')) return 'g'
  if (normalized.includes('kilogram')) return 'kg'
  if (normalized.includes('milliliter') || normalized === 'ml') return 'ml'
  if (normalized.includes('liter')) return 'l'
  if (normalized.includes('cup')) return 'cup'
  if (normalized.includes('tablespoon') || normalized === 'tbsp') return 'tablespoon'
  if (normalized.includes('teaspoon') || normalized === 'tsp') return 'teaspoon'
  if (normalized.includes('slice')) return 'slice'
  if (normalized.includes('piece')) return 'piece'
  if (normalized.includes('unit')) return 'unit'
  return 'portion'
}

function foodPortions(food: UsdaFood) {
  const rawPortions = Array.isArray(food.foodPortions) ? food.foodPortions : []
  const seen = new Set<string>()
  const portions: JsonRecord[] = []
  rawPortions.forEach((raw, index) => {
    const item = record(raw)
    const measure = record(item.measureUnit)
    const measureName = text(measure.name) || text(measure.abbreviation) || 'portion'
    const unit = portionUnit(measureName)
    const grams = positiveNumber(item.gramWeight)
    if (grams === null) return
    const amount = positiveNumber(item.amount ?? item.value) ?? 1
    const label = `${amount} ${measureName}`
    const key = `${unit}:${label}`.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    portions.push({ label, unit, grams, ml: null, is_default: index === 0, metadata: { amount, measure: measureName, modifier: text(item.modifier), source_portion_id: item.id ?? null } })
  })
  if (!portions.length) portions.push({ label: '100 g', unit: 'g', grams: 100, ml: null, is_default: true, metadata: { source: 'USDA nutrition basis' } })
  return portions
}

function rawFoods(foods: UsdaFood[]): { foods: ParsedFood[]; invalid: number } {
  const seen = new Set<string>()
  const parsed: ParsedFood[] = []
  let invalid = 0
  foods.forEach((food) => {
    const externalId = String(food.fdcId ?? '').trim()
    const name = text(food.description)
    if (!externalId || !name || seen.has(externalId)) { invalid += 1; return }
    const category = text(record(food.foodCategory).description)
    parsed.push({ externalId, name, nameEs: '', nameEn: name, category, categoryEs: '', categoryEn: category, nutrients: coreNutrients(food), portions: foodPortions(food) })
    seen.add(externalId)
  })
  return { foods: parsed, invalid }
}

function translationSegments(payload: unknown) {
  const first = Array.isArray(payload) ? payload[0] : null
  if (!Array.isArray(first)) return []
  return first.map((segment) => Array.isArray(segment) && typeof segment[0] === 'string' ? segment[0].trim() : '').filter(Boolean)
}

async function translateBatch(values: string[], target: 'es' | 'en') {
  const result = new Map<string, string>()
  for (let index = 0; index < values.length; index += translationBatchSize) {
    const batch = values.slice(index, index + translationBatchSize)
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${target}&dt=t&q=${encodeURIComponent(batch.join('\n'))}`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Translation request failed (${response.status}).`)
    const translated = translationSegments(await response.json() as unknown)
    batch.forEach((value, batchIndex) => result.set(value, translated[batchIndex] ?? value))
  }
  return result
}

async function translateValues(values: string[], target: 'es' | 'en') {
  const unique = [...new Set(values.filter(Boolean))]
  const result = new Map<string, string>()
  let cursor = 0
  const worker = async () => {
    while (cursor < unique.length) {
      const start = cursor
      cursor += translationBatchSize
      const batch = unique.slice(start, start + translationBatchSize)
      const translated = await translateBatch(batch, target)
      translated.forEach((value, key) => result.set(key, value))
    }
  }
  await Promise.all(Array.from({ length: Math.min(translationConcurrency, Math.max(1, Math.ceil(unique.length / translationBatchSize))) }, () => worker()))
  return result
}

async function upsertChunks(table: string, values: JsonRecord[], onConflict: string) {
  for (let index = 0; index < values.length; index += chunkSize) {
    const result = await admin.from(table).upsert(values.slice(index, index + chunkSize), { onConflict })
    if (result.error) throw result.error
  }
}

async function loadExisting(sourceId: string) {
  const existing = new Map<string, { nameEs: string; nameEn: string }>()
  for (let from = 0; ; from += 1000) {
    const result = await admin.from('foods').select('external_id, name_es, name_en').eq('source_id', sourceId).range(from, from + 999)
    if (result.error) throw result.error
    const page = (result.data ?? []) as Array<{ external_id: string; name_es: string | null; name_en: string | null }>
    page.forEach((row) => existing.set(row.external_id, { nameEs: row.name_es ?? '', nameEn: row.name_en ?? '' }))
    if (page.length < 1000) return existing
  }
}

async function loadFoodIds(sourceId: string) {
  const ids = new Map<string, string>()
  for (let from = 0; ; from += 1000) {
    const result = await admin.from('foods').select('id, external_id').eq('source_id', sourceId).range(from, from + 999)
    if (result.error) throw result.error
    const page = (result.data ?? []) as Array<{ id: string; external_id: string }>
    page.forEach((row) => ids.set(row.external_id, row.id))
    if (page.length < 1000) return ids
  }
}

async function importDataset(dataset: DatasetConfig) {
  const sourceResult = await admin.from('food_sources').upsert({ source_key: dataset.key, name: dataset.name, source_url: dataset.url, license: 'CC0 1.0 Universal', attribution: dataset.attribution, imported_at: new Date().toISOString(), metadata: { basis: 'per_100g', importer: 'scripts/seed-foods-usda.ts' } }, { onConflict: 'source_key' }).select('id').single()
  if (sourceResult.error || !sourceResult.data) throw sourceResult.error ?? new Error(`Could not register ${dataset.name}.`)
  const sourceId = String(sourceResult.data.id)
  const existing = await loadExisting(sourceId)
  const parsed = rawFoods(await fetchDataset(dataset))
  const foods = parsed.foods
  const missingNames = foods.filter((food) => !existing.get(food.externalId)?.nameEn).map((food) => food.name)
  const missingCategories = foods.filter((food) => !existing.get(food.externalId)?.nameEn).map((food) => food.category)
  const [spanishNames, spanishCategories] = await Promise.all([translateValues(missingNames, 'es'), translateValues(missingCategories, 'es')])
  const translated = foods.map((food) => { const cached = existing.get(food.externalId); return { ...food, nameEs: cached?.nameEs || spanishNames.get(food.name) || food.name, nameEn: cached?.nameEn || food.name, categoryEs: spanishCategories.get(food.category) || food.category, categoryEn: food.category } })
  const foodRows = translated.map((food) => ({ source_id: sourceId, external_id: food.externalId, name: food.nameEn, name_es: food.nameEs, name_en: food.nameEn, description: food.nameEn, category: food.categoryEn, subcategory: '', food_group: food.categoryEn, brand: null, barcode: null, default_unit: 'g', is_basic_food: true, is_packaged: false, metadata: { category_es: food.categoryEs, category_en: food.categoryEn, source_description: food.name, data_type: dataset.rootKey } }))
  await upsertChunks('foods', foodRows, 'source_id,external_id')
  const foodIds = await loadFoodIds(sourceId)
  const nutrientRows = translated.flatMap((food) => { const foodId = foodIds.get(food.externalId); return foodId ? [{ food_id: foodId, basis: 'per_100g', ...food.nutrients }] : [] })
  const portionRows = translated.flatMap((food) => { const foodId = foodIds.get(food.externalId); return foodId ? food.portions.map((portion) => ({ food_id: foodId, ...portion })) : [] })
  await upsertChunks('food_nutrients', nutrientRows, 'food_id,basis')
  await upsertChunks('food_portions', portionRows, 'food_id,unit,label')
  const imported = translated.filter((food) => !existing.has(food.externalId)).length
  console.log(`${dataset.key}: Imported: ${imported}\n${dataset.key}: Updated: ${translated.length - imported}\n${dataset.key}: Invalid: ${parsed.invalid}\n${dataset.key}: Source records: ${translated.length}`)
  return translated.length
}

async function main() {
  const selected = datasets.filter((dataset) => selectedKeys.has(dataset.key))
  if (!selected.length) throw new Error(`No USDA dataset selected. Available: ${datasets.map((dataset) => dataset.key).join(', ')}`)
  let total = 0
  for (const dataset of selected) total += await importDataset(dataset)
  console.log(`USDA source records: ${total}`)
}

void main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1 })

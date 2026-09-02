import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

type JsonRecord = Record<string, unknown>
type CsvRecord = Record<string, string>
type ParsedFood = { externalId: string; name: string; nameEs: string; nameEn: string; category: string; categoryEs: string; categoryEn: string; subcategory: string; subcategoryEs: string; subcategoryEn: string; base: string; qualifiers: string; nutrients: JsonRecord }

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceRoleKey) throw new Error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running yarn seed:foods.')

const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
const compositionUrl = process.env.TACO_COMPOSITION_URL ?? 'https://raw.githubusercontent.com/brolesi/taco/main/data/processed/taco/taco_composicao.csv'
const chunkSize = 200
const requiredColumns = ['numero_alimento', 'descricao', 'categoria', 'base', 'preparo', 'qualificadores', 'energia_kcal', 'proteina_g', 'carboidrato_g', 'lipideos_g', 'fibra_g', 'colesterol_mg', 'sodio_mg']
const micronutrientColumns = ['calcio_mg', 'magnesio_mg', 'manganes_mg', 'fosforo_mg', 'ferro_mg', 'potassio_mg', 'cobre_mg', 'zinco_mg', 'retinol_mcg', 'RE_mcg', 'RAE_mcg', 'tiamina_mg', 'riboflavina_mg', 'piridoxina_mg', 'niacina_mg', 'vitamina_c_mg']
const taxonomyTranslations: Record<string, { es: string; en: string }> = {
  'alimentos preparados': { es: 'Alimentos preparados', en: 'Prepared foods' },
  'bebidas (alcoólicas e não alcoólicas)': { es: 'Bebidas (alcohólicas y no alcohólicas)', en: 'Beverages (alcoholic and non-alcoholic)' },
  'carnes e derivados': { es: 'Carnes y derivados', en: 'Meat and meat products' },
  'cereais e derivados': { es: 'Cereales y derivados', en: 'Cereals and cereal products' },
  'frutas e derivados': { es: 'Frutas y derivados', en: 'Fruits and fruit products' },
  'gorduras e óleos': { es: 'Grasas y aceites', en: 'Fats and oils' },
  'leguminosas e derivados': { es: 'Legumbres y derivados', en: 'Legumes and legume products' },
  'leite e derivados': { es: 'Leche y derivados', en: 'Milk and dairy products' },
  'miscelâneas': { es: 'Misceláneos', en: 'Miscellaneous' },
  'nozes e sementes': { es: 'Nueces y semillas', en: 'Nuts and seeds' },
  'outros alimentos industrializados': { es: 'Otros alimentos industrializados', en: 'Other processed foods' },
  'ovos e derivados': { es: 'Huevos y derivados', en: 'Eggs and egg products' },
  'pescados e frutos do mar': { es: 'Pescados y mariscos', en: 'Fish and seafood' },
  'produtos açucarados': { es: 'Productos azucarados', en: 'Sugary products' },
  'verduras, hortaliças e derivados': { es: 'Verduras, hortalizas y derivados', en: 'Vegetables and vegetable products' },
  cru: { es: 'Crudo', en: 'Raw' },
  cozido: { es: 'Cocido', en: 'Cooked' },
  frito: { es: 'Frito', en: 'Fried' },
  grelhado: { es: 'A la parrilla', en: 'Grilled' },
  assado: { es: 'Asado', en: 'Baked' },
  refogado: { es: 'Salteado', en: 'Sautéed' },
  torrado: { es: 'Tostado', en: 'Toasted' },
}

function parseCsv(input: string): string[][] {
  const parsed: string[][] = []
  let currentRow: string[] = []
  let currentValue = ''
  let quoted = false
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index]
    if (quoted) {
      if (character === '"') {
        if (input[index + 1] === '"') { currentValue += '"'; index += 1 } else quoted = false
      } else currentValue += character
      continue
    }
    if (character === '"') { quoted = true; continue }
    if (character === ',') { currentRow.push(currentValue); currentValue = ''; continue }
    if (character === '\n') { currentRow.push(currentValue); parsed.push(currentRow); currentRow = []; currentValue = ''; continue }
    if (character !== '\r') currentValue += character
  }
  if (currentValue || currentRow.length) { currentRow.push(currentValue); parsed.push(currentRow) }
  return parsed.filter((row) => row.some((value) => value.trim()))
}

function records(input: string): CsvRecord[] {
  const [header, ...data] = parseCsv(input)
  if (!header) throw new Error('The TACO CSV is empty.')
  const columns = header.map((column) => column.trim())
  const missingColumns = requiredColumns.filter((column) => !columns.includes(column))
  if (missingColumns.length) throw new Error(`The TACO CSV is missing columns: ${missingColumns.join(', ')}`)
  return data.map((values) => Object.fromEntries(columns.map((column, index) => [column, values[index]?.trim() ?? ''])))
}

function text(value: string | undefined) { return value?.trim() ?? '' }

function numberValue(value: string | undefined, field: string, rowNumber: number) {
  const normalized = text(value)
  if (!normalized || normalized.toLowerCase() === 'na') return null
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) throw new Error(`Invalid ${field} at CSV row ${rowNumber}.`)
  if (parsed < 0 && parsed > -0.05) return 0
  if (parsed < 0) throw new Error(`Invalid ${field} at CSV row ${rowNumber}.`)
  return parsed
}

function sourceRow() {
  return { source_key: 'taco', name: 'TACO — NEPA/UNICAMP via brolesi/taco', source_url: 'https://github.com/brolesi/taco', license: 'MIT for the repository; primary-source terms apply to the data.', attribution: 'TACO, 4th edition (NEPA/UNICAMP), processed by brolesi/taco.', imported_at: new Date().toISOString(), metadata: { composition_url: compositionUrl, basis: 'per_100g edible portion', portions: 'Default 100 g portion; POF mapping is kept separate until an explicit mapping is available.' } }
}

async function fetchText(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Could not download ${url} (${response.status} ${response.statusText}).`)
  return response.text()
}

const translationCache = new Map<string, string>()

function translationFromPayload(payload: unknown) {
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) return ''
  return payload[0].map((segment) => Array.isArray(segment) && typeof segment[0] === 'string' ? segment[0] : '').join('').trim()
}

async function translateText(value: string, target: 'es' | 'en') {
  const key = `${target}:${value}`
  const cached = translationCache.get(key)
  if (cached) return cached
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=${target}&dt=t&q=${encodeURIComponent(value)}`
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`translation ${response.status}`)
      const translated = translationFromPayload(await response.json() as unknown)
      if (translated) { translationCache.set(key, translated); return translated }
    } catch {
      if (attempt === 1) throw new Error(`Could not translate food value to ${target}: ${value}`)
    }
  }
  throw new Error(`Could not translate food value to ${target}: ${value}`)
}

async function translateOptional(value: string, target: 'es' | 'en') {
  return value ? translateText(value, target) : ''
}

async function translateTaxonomy(value: string, target: 'es' | 'en') {
  const translation = taxonomyTranslations[value.toLowerCase()]
  return translation?.[target] ?? translateOptional(value, target)
}

async function translateRows(rows: ParsedFood[], existing: Map<string, { nameEs: string; nameEn: string }>) {
  const translated = new Array<ParsedFood>(rows.length)
  let cursor = 0
  const worker = async () => {
    while (cursor < rows.length) {
      const index = cursor
      cursor += 1
      const row = rows[index]
      const cached = existing.get(row.externalId)
      const [nameEs, nameEn] = cached?.nameEs && cached.nameEn ? [cached.nameEs, cached.nameEn] : await Promise.all([translateText(row.name, 'es'), translateText(row.name, 'en')])
      const [categoryEs, categoryEn, subcategoryEs, subcategoryEn] = await Promise.all([translateTaxonomy(row.category, 'es'), translateTaxonomy(row.category, 'en'), translateTaxonomy(row.subcategory, 'es'), translateTaxonomy(row.subcategory, 'en')])
      translated[index] = { ...row, nameEs, nameEn, categoryEs, categoryEn, subcategoryEs, subcategoryEn }
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, rows.length) }, () => worker()))
  return translated
}

async function upsertChunks(table: string, values: JsonRecord[], onConflict: string) {
  for (let index = 0; index < values.length; index += chunkSize) {
    const result = await admin.from(table).upsert(values.slice(index, index + chunkSize), { onConflict })
    if (result.error) throw result.error
  }
}

async function loadFoodIds(sourceId: string) {
  const result = new Map<string, string>()
  for (let from = 0; ; from += 1000) {
    const response = await admin.from('foods').select('id, external_id').eq('source_id', sourceId).range(from, from + 999)
    if (response.error) throw response.error
    const page = (response.data ?? []) as Array<{ id: string; external_id: string }>
    page.forEach((row) => result.set(row.external_id, row.id))
    if (page.length < 1000) return result
  }
}

async function main() {
  const csv = await fetchText(compositionUrl)
  const inputRows = records(csv)
  const validRows: ParsedFood[] = []
  let invalid = 0
  const invalidRows: string[] = []
  const seenIds = new Set<string>()
  inputRows.forEach((row, index) => {
    const rowNumber = index + 2
    const reject = (reason: string) => { invalid += 1; invalidRows.push(`row ${rowNumber}: ${reason}`) }
    const externalId = text(row.numero_alimento)
    const name = text(row.descricao)
    if (!externalId) { reject('missing numero_alimento'); return }
    if (!name) { reject(`missing descricao for ${externalId}`); return }
    if (seenIds.has(externalId)) { reject(`duplicate numero_alimento ${externalId}`); return }
    try {
      const nutrients: JsonRecord = {
        calories: numberValue(row.energia_kcal, 'energia_kcal', rowNumber),
        protein_g: numberValue(row.proteina_g, 'proteina_g', rowNumber),
        carbohydrates_g: numberValue(row.carboidrato_g, 'carboidrato_g', rowNumber),
        fat_g: numberValue(row.lipideos_g, 'lipideos_g', rowNumber),
        fiber_g: numberValue(row.fibra_g, 'fibra_g', rowNumber),
        cholesterol_mg: numberValue(row.colesterol_mg, 'colesterol_mg', rowNumber),
        sodium_mg: numberValue(row.sodio_mg, 'sodio_mg', rowNumber),
        micronutrients: Object.fromEntries(micronutrientColumns.map((column) => [column, numberValue(row[column], column, rowNumber)]).filter(([, value]) => value !== null)),
      }
      validRows.push({ externalId, name, nameEs: '', nameEn: '', category: text(row.categoria), categoryEs: '', categoryEn: '', subcategory: text(row.preparo), subcategoryEs: '', subcategoryEn: '', base: text(row.base), qualifiers: text(row.qualificadores), nutrients })
      seenIds.add(externalId)
    } catch (error) {
      reject(`${error instanceof Error ? error.message : 'invalid numeric value'} (${externalId} · ${name} · raw carboidrato_g=${JSON.stringify(row.carboidrato_g)})`)
    }
  })

  const sourceResult = await admin.from('food_sources').upsert(sourceRow(), { onConflict: 'source_key' }).select('id').single()
  if (sourceResult.error || !sourceResult.data) throw sourceResult.error ?? new Error('Could not create the TACO food source.')
  const sourceId = String(sourceResult.data.id)
  const existingResult = await admin.from('foods').select('external_id, name_es, name_en').eq('source_id', sourceId).range(0, 999)
  if (existingResult.error) throw existingResult.error
  const existingRows = (existingResult.data ?? []) as Array<{ external_id: string; name_es: string | null; name_en: string | null }>
  const existingIds = new Set(existingRows.map((row) => row.external_id))
  const existingTranslations = new Map(existingRows.map((row) => [row.external_id, { nameEs: row.name_es ?? '', nameEn: row.name_en ?? '' }]))
  const translatedRows = await translateRows(validRows, existingTranslations)

  await upsertChunks('foods', translatedRows.map((row) => ({ source_id: sourceId, external_id: row.externalId, name: row.name, name_es: row.nameEs, name_en: row.nameEn, description: row.name, category: row.category, subcategory: row.subcategory, food_group: row.base, brand: null, barcode: null, default_unit: 'g', is_basic_food: true, is_packaged: false, metadata: { base: row.base, preparation: row.subcategory, qualifiers: row.qualifiers, category_es: row.categoryEs, category_en: row.categoryEn, preparation_es: row.subcategoryEs, preparation_en: row.subcategoryEn } })), 'source_id,external_id')
  const foodIds = await loadFoodIds(sourceId)
  const nutrients = translatedRows.flatMap((row) => { const foodId = foodIds.get(row.externalId); return foodId ? [{ food_id: foodId, basis: 'per_100g', ...row.nutrients }] : [] })
  const portions = translatedRows.flatMap((row) => { const foodId = foodIds.get(row.externalId); return foodId ? [{ food_id: foodId, label: '100 g', unit: 'g', grams: 100, ml: null, is_default: true, metadata: { source: 'TACO composition basis' } }] : [] })
  const aliases = translatedRows.flatMap((row) => { const foodId = foodIds.get(row.externalId); return foodId && row.base && row.base.toLowerCase() !== row.name.toLowerCase() ? [{ food_id: foodId, alias: row.base, language: 'pt' }] : [] })
  await upsertChunks('food_nutrients', nutrients, 'food_id,basis')
  await upsertChunks('food_portions', portions, 'food_id,unit,label')
  await upsertChunks('food_aliases', aliases, 'food_id,alias,language')

  const imported = translatedRows.filter((row) => !existingIds.has(row.externalId)).length
  const updated = translatedRows.length - imported
  console.log(`Imported: ${imported}\nUpdated: ${updated}\nSkipped: 0\nInvalid: ${invalid}\nFailed: 0\nSource records: ${translatedRows.length}`)
  if (invalidRows.length) console.log(`Invalid rows:\n${invalidRows.join('\n')}`)
}

void main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1 })

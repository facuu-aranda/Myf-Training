import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

type JsonRecord = Record<string, unknown>
const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceRoleKey) throw new Error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running yarn seed:exercises.')
const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
const dataUrl = process.env.EXERCISES_DATA_URL ?? 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json'
const mediaRoot = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main'
const sourceUrl = 'https://github.com/hasaneyldrm/exercises-dataset'

function record(value: unknown): JsonRecord { return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {} }
function text(value: unknown, fallback = '') { return typeof value === 'string' ? value : fallback }
function steps(value: unknown, fallback: string) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : fallback ? fallback.split(/\n|(?<=\.)\s+/).map((item) => item.trim()).filter(Boolean) : [] }
function media(value: unknown) { const path = text(value); return path ? path.startsWith('http') ? path : `${mediaRoot}/${path.replace(/^\//, '')}` : null }
function row(raw: unknown) {
  const item = record(raw)
  const instructions = record(item.instructions)
  const instructionSteps = record(item.instruction_steps)
  const english = text(instructions.en)
  const spanish = text(instructions.es, english)
  return { external_id: text(item.id), name: text(item.name, 'Unnamed exercise'), name_es: text(item.name_es, text(item.name, 'Unnamed exercise')), description: '', instructions: { en: steps(instructionSteps.en, english), es: steps(instructionSteps.es, spanish) }, muscle_group: text(item.muscle_group), target: text(item.target), category: text(item.category, text(item.body_part)), equipment: text(item.equipment), video_url: media(item.gif_url), thumbnail_url: media(item.image), image_url: media(item.image), source: 'exercises-dataset', source_url: sourceUrl, metadata: { media_id: text(item.media_id), secondary_muscles: item.secondary_muscles ?? [], attribution: text(item.attribution) } }
}

async function main() {
  const response = await fetch(dataUrl)
  if (!response.ok) throw new Error(`Could not download dataset (${response.status} ${response.statusText}).`)
  const payload: unknown = await response.json()
  if (!Array.isArray(payload)) throw new Error('The dataset response is not a JSON array.')
  const rows = payload.map(row).filter((item) => item.external_id)
  let imported = 0; let failed = 0
  for (let index = 0; index < rows.length; index += 250) {
    const chunk = rows.slice(index, index + 250)
    const result = await admin.from('exercises').upsert(chunk, { onConflict: 'external_id' })
    if (result.error) { failed += chunk.length; console.error(`Chunk ${index + 1}-${index + chunk.length} failed: ${result.error.message}`) } else imported += chunk.length
  }
  console.log(`Imported: ${imported}\nUpdated: ${imported}\nSkipped: 0\nFailed: ${failed}`)
}
void main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1 })

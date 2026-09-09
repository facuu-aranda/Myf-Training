import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const allowSeed = process.env.ALLOW_DEMO_SEED === 'true'
const referenceDate = process.env.DEMO_REFERENCE_DATE ?? '2026-09-09'
const password = process.env.DEMO_SEED_PASSWORD
if (!supabaseUrl || !serviceRoleKey) throw new Error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running the commercial demo seed.')
if (!allowSeed) throw new Error('Commercial demo seed is disabled. Set ALLOW_DEMO_SEED=true only for local/staging.')
if (!password) throw new Error('Set DEMO_SEED_PASSWORD explicitly; demo credentials are never generated implicitly.')
if (/prod|production/i.test(`${process.env.NODE_ENV ?? ''} ${supabaseUrl}`)) throw new Error('Commercial demo seed refuses production-like environments.')

const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
const demoUsers = [
  ['demo.free', 'Sofía Benítez', 'free'], ['demo.plus', 'Martín Sosa', 'plus'],
  ['demo.couple.lucia', 'Lucía Ferrero', 'couple'], ['demo.couple.tomas', 'Tomás Herrera', 'free'],
  ['demo.family.ana', 'Ana Rodríguez', 'household'], ['demo.family.diego', 'Diego Rodríguez', 'free'],
  ['demo.coach.starter', 'Juan Acosta', 'coach_starter'], ['demo.coach.pro', 'Marina Quiroga', 'coach_pro'],
  ['demo.athlete.camila', 'Camila Ríos', 'free'], ['demo.athlete.nicolas', 'Nicolás Vega', 'free'],
  ['demo.athlete.rocio', 'Rocío Medina', 'free'], ['demo.athlete.bruno', 'Bruno López', 'free'], ['demo.athlete.micaela', 'Micaela Torres', 'free'],
] as const

function stableUuid(value: string) {
  const hex = createHash('sha256').update(value).digest('hex').slice(0, 32).split('')
  hex[12] = '5'; hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16)
  return `${hex.slice(0, 8).join('')}-${hex.slice(8, 12).join('')}-${hex.slice(12, 16).join('')}-${hex.slice(16, 20).join('')}-${hex.slice(20).join('')}`
}

async function getOrCreateUser(username: string, displayName: string) {
  const email = `${username}@nuvia.local`
  const listed = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (listed.error) throw listed.error
  const existing = listed.data.users.find((item) => item.email === email)
  if (existing) return existing.id
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { username, display_name: displayName, demo: true } })
  if (created.error || !created.data.user) throw created.error ?? new Error(`Could not create ${username}`)
  return created.data.user.id
}

async function seed() {
  const ids: Record<string, string> = {}
  for (const [username, displayName] of demoUsers) ids[username] = await getOrCreateUser(username, displayName)
  const profiles = await admin.from('profiles').upsert(demoUsers.map(([username, displayName]) => ({ id: ids[username], username, display_name: displayName, first_name: displayName.split(' ')[0], public_handle: `${username.replace(/[^a-z0-9]/g, '')}-${ids[username].slice(0, 4)}`, public_code: `NU-${ids[username].slice(0, 6).toUpperCase()}`, discoverable: true, profile_visibility: 'discoverable', progress_visibility: 'household', active: true })), { onConflict: 'id' })
  if (profiles.error) throw profiles.error
  const plans = await admin.from('plans').select('id, code')
  if (plans.error) throw plans.error
  const planIds = new Map((plans.data as Array<{ id: string; code: string }>).map((plan) => [plan.code, plan.id]))
  const starts = `${referenceDate}T00:00:00.000Z`
  const ends = `${Number(referenceDate.slice(0, 4)) + 1}${referenceDate.slice(4)}T00:00:00.000Z`
  for (const [username, , code] of demoUsers) {
    if (code === 'free') continue
    const planId = planIds.get(code)
    if (!planId) throw new Error(`Plan ${code} is missing. Apply commercial migration first.`)
    const price = await admin.from('plan_prices').select('id, amount_minor, currency').eq('plan_id', planId).eq('currency', 'ARS').eq('billing_interval', 'month').eq('active', true).limit(1).maybeSingle()
    if (price.error || !price.data) throw price.error ?? new Error(`Price for ${code} is missing.`)
    const subscription = await admin.from('subscriptions').upsert({ id: stableUuid(`demo-subscription:${username}`), user_id: ids[username], plan_id: planId, plan_price_id: price.data.id, provider: 'seed', status: 'active', billing_interval: 'month', currency: price.data.currency, amount_minor: price.data.amount_minor, current_period_start: starts, current_period_end: ends, metadata: { demo: true, reference_date: referenceDate } }, { onConflict: 'id' })
    if (subscription.error) throw subscription.error
  }

  const grantRows = [
    ['demo.couple.tomas', 'plus', 'household_membership'],
    ['demo.family.diego', 'plus', 'household_membership'],
    ['demo.coach.starter', 'coach_starter', 'coaching_relationship'],
    ...(['demo.athlete.camila', 'demo.athlete.nicolas', 'demo.athlete.rocio', 'demo.athlete.bruno', 'demo.athlete.micaela'] as const).map((username) => [username, 'coach_sponsored_athlete', 'coaching_relationship'] as const),
  ] as const
  const grants = await admin.from('entitlement_grants').upsert(grantRows.map(([username, bundleCode, sourceType]) => ({ id: stableUuid(`demo-grant:${username}`), user_id: ids[username], bundle_code: bundleCode, source_type: sourceType, source_id: stableUuid(`demo-source:${bundleCode}`), starts_at: starts, active: true, metadata: { demo: true, sponsored_bundle: bundleCode, reference_date: referenceDate } })), { onConflict: 'id' })
  if (grants.error) throw grants.error

  const householdRows = [
    { id: stableUuid('demo-household:family'), name: 'Familia Rodríguez', household_type: 'household', owner_user_id: ids['demo.family.ana'], max_members: 5 },
  ]
  const households = await admin.from('households').upsert(householdRows, { onConflict: 'id' })
  if (households.error) throw households.error
  const householdMembers = await admin.from('household_members').upsert([
    ['demo.family.ana', 'owner'], ['demo.family.diego', 'member'],
  ].map(([username, role]) => ({ household_id: householdRows[0].id, user_id: ids[username], role })), { onConflict: 'household_id,user_id' })
  if (householdMembers.error) throw householdMembers.error

  const spaceRows = [
    { id: stableUuid('demo-space:starter'), owner_user_id: ids['demo.coach.starter'], name: 'Juan Acosta Coaching', type: 'coaching', max_members: 10, status: 'active', metadata: { demo: true, plan: 'coach_starter' } },
    { id: stableUuid('demo-space:pro'), owner_user_id: ids['demo.coach.pro'], name: 'Marina Performance', type: 'coaching', max_members: 30, status: 'active', metadata: { demo: true, plan: 'coach_pro' } },
  ]
  const spaces = await admin.from('spaces').upsert(spaceRows, { onConflict: 'id' })
  if (spaces.error) throw spaces.error
  const spaceMembers = await admin.from('space_members').upsert(spaceRows.flatMap((space) => {
    const athletes = space.id === spaceRows[0].id ? ['demo.athlete.camila', 'demo.athlete.nicolas', 'demo.athlete.rocio', 'demo.athlete.bruno', 'demo.athlete.micaela'] : ['demo.coach.starter']
    return [{ space_id: space.id, user_id: space.owner_user_id, role: 'owner', status: 'active' }, ...athletes.map((username) => ({ space_id: space.id, user_id: ids[username], role: 'athlete', status: 'active' }))]
  }), { onConflict: 'space_id,user_id' })
  if (spaceMembers.error) throw spaceMembers.error
  const relationships = await admin.from('coach_athlete_relationships').upsert(spaceRows.flatMap((space) => {
    const athletes = space.id === spaceRows[0].id ? ['demo.athlete.camila', 'demo.athlete.nicolas', 'demo.athlete.rocio', 'demo.athlete.bruno', 'demo.athlete.micaela'] : ['demo.coach.starter']
    return athletes.map((username) => ({ id: stableUuid(`demo-relationship:${space.id}:${username}`), space_id: space.id, coach_user_id: space.owner_user_id, athlete_user_id: ids[username], status: 'active', started_at: starts }))
  }), { onConflict: 'id' })
  if (relationships.error) throw relationships.error
  console.log(`Commercial demo seed ready for ${demoUsers.length} synthetic users, 6 coaching relationships (reference ${referenceDate}).`)
}

void seed().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1 })

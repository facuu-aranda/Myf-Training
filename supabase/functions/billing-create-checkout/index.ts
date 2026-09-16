import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
function response(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return response({ error: 'method_not_allowed' }, 405)
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
  const environment = Deno.env.get('MERCADOPAGO_ENVIRONMENT') ?? 'test'
  const testPayerEmail = Deno.env.get('MERCADOPAGO_TEST_PAYER_EMAIL')
  const appUrl = Deno.env.get('APP_PUBLIC_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!token || !supabaseUrl || !supabaseAnonKey) return response({ error: 'unauthorized' }, 401)
  if (!accessToken || !appUrl) return response({ error: 'billing_provider_unavailable' }, 503)
  if (environment === 'test' && !testPayerEmail) return response({ error: 'test_payer_not_configured' }, 503)
  const client = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } })
  const auth = await client.auth.getUser(token)
  if (auth.error || !auth.data.user) return response({ error: 'unauthorized' }, 401)
  let body: { planPriceId?: unknown }
  try { body = await request.json() } catch { return response({ error: 'invalid_json' }, 400) }
  if (typeof body.planPriceId !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.planPriceId)) return response({ error: 'invalid_plan_price' }, 422)
  const intent = await client.rpc('create_billing_checkout_intent', { target_plan_price_id: body.planPriceId })
  if (intent.error || !intent.data || typeof intent.data !== 'object') return response({ error: intent.error?.message ?? 'checkout_intent_failed' }, 422)
  const intentData = intent.data as Record<string, unknown>
  const price = await client.from('plan_prices').select('amount_minor, currency, billing_interval, plans(name, code)').eq('id', body.planPriceId).maybeSingle()
  if (price.error || !price.data) return response({ error: 'plan_price_unavailable' }, 422)
  const plan = Array.isArray(price.data.plans) ? price.data.plans[0] : price.data.plans
  const amount = Number(price.data.amount_minor) / 100
  const interval = price.data.billing_interval === 'year' ? 'years' : 'months'
  const payerEmail = environment === 'test' ? testPayerEmail : auth.data.user.email
  const providerResponse = await fetch('https://api.mercadopago.com/preapproval', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: `Nuvia ${String((plan as Record<string, unknown> | null)?.name ?? 'subscription')}`, external_reference: String(intentData.id), payer_email: payerEmail, auto_recurring: { frequency: 1, frequency_type: interval, transaction_amount: amount, currency_id: price.data.currency }, back_url: `${appUrl.replace(/\/$/, '')}/app/billing/return`, status: 'pending' }) })
  if (!providerResponse.ok) {
    const providerError = await providerResponse.text()
    let detail: Record<string, unknown> = {}
    try { detail = JSON.parse(providerError) as Record<string, unknown> } catch { detail = { message: providerError.slice(0, 300) } }
    console.error('Mercado Pago checkout rejected request', { status: providerResponse.status, body: providerError.slice(0, 1000) })
    return response({ error: 'provider_checkout_failed', providerStatus: providerResponse.status, providerCode: detail.error ?? detail.code ?? null, providerMessage: detail.message ?? null }, 502)
  }
  const provider = await providerResponse.json()
  if (typeof provider.id !== 'string' || typeof provider.init_point !== 'string') return response({ error: 'provider_invalid_response' }, 502)
  if (serviceRoleKey) {
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
    await admin.from('billing_checkout_intents').update({ status: 'redirected', provider_reference: provider.id }).eq('id', String(intentData.id)).eq('user_id', auth.data.user.id)
  }
  return response({ intentId: intentData.id, providerSubscriptionId: provider.id, redirectUrl: provider.init_point, environment })
})

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildSignatureManifest, isFreshSignature, mapProviderSubscriptionStatus, parseSignature } from '../_shared/mercadopago.ts'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type, x-signature, x-request-id', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
function response(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
async function hmac(secret: string, message: string) { const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))); return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('') }
function sameSignature(left: string, right: string) { if (left.length !== right.length) return false; let result = 0; for (let index = 0; index < left.length; index += 1) result |= left.charCodeAt(index) ^ right.charCodeAt(index); return result === 0 }

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return response({ error: 'method_not_allowed' }, 405)
  const secret = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET')
  const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!secret || !accessToken || !supabaseUrl || !serviceRoleKey) return response({ error: 'webhook_not_configured' }, 503)
  const signature = parseSignature(request.headers.get('x-signature') ?? '')
  const requestId = request.headers.get('x-request-id') ?? ''
  const dataId = new URL(request.url).searchParams.get('data.id')?.toLowerCase() ?? ''
  if (!signature.ts || !signature.v1 || !requestId || !dataId) return response({ error: 'invalid_signature_headers' }, 401)
  if (!isFreshSignature(signature.ts)) return response({ error: 'stale_signature' }, 401)
  const expected = await hmac(secret, buildSignatureManifest(dataId, requestId, signature.ts))
  if (!sameSignature(expected, signature.v1)) return response({ error: 'invalid_signature' }, 401)
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return response({ error: 'invalid_json' }, 400) }
  const provider = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const eventId = String(body.id ?? `${body.type ?? 'unknown'}:${dataId}`)
  const eventType = String(body.type ?? body.action ?? 'unknown')
  const recorded = await provider.from('subscription_events').insert({ provider: 'mercadopago', provider_event_id: eventId, event_type: eventType, provider_subscription_id: dataId, status: 'received', payload: body })
  if (recorded.error?.code === '23505') return response({ ok: true, duplicate: true })
  if (recorded.error) return response({ error: 'event_record_failed' }, 500)
  const resource = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(dataId)}`, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!resource.ok) { await provider.from('subscription_events').update({ status: 'failed', processing_error: 'provider_resource_unavailable', processed_at: new Date().toISOString() }).eq('provider_event_id', eventId).eq('provider', 'mercadopago'); return response({ error: 'provider_resource_unavailable' }, 502) }
  const subscription = await resource.json()
  const intentId = typeof subscription.external_reference === 'string' ? subscription.external_reference : ''
  const intent = await provider.from('billing_checkout_intents').select('id, user_id, plan_price_id, plan_prices(plan_id, billing_interval, currency, amount_minor)').eq('id', intentId).maybeSingle()
  if (intent.error || !intent.data) { await provider.from('subscription_events').update({ status: 'failed', processing_error: 'checkout_intent_not_found', processed_at: new Date().toISOString() }).eq('provider_event_id', eventId).eq('provider', 'mercadopago'); return response({ error: 'checkout_intent_not_found' }, 422) }
  const price = Array.isArray(intent.data.plan_prices) ? intent.data.plan_prices[0] : intent.data.plan_prices as Record<string, unknown>
  const status = mapProviderSubscriptionStatus(subscription.status)
  const start = typeof subscription.date_created === 'string' ? subscription.date_created : new Date().toISOString()
  const end = typeof subscription.next_payment_date === 'string' ? subscription.next_payment_date : new Date(Date.now() + (price?.billing_interval === 'year' ? 365 : 30) * 86400000).toISOString()
  const existing = await provider.from('subscriptions').select('id').eq('provider', 'mercadopago').eq('provider_subscription_id', dataId).maybeSingle()
  let subscriptionId = existing.data?.id
  const row = { user_id: intent.data.user_id, plan_id: price?.plan_id, plan_price_id: intent.data.plan_price_id, provider: 'mercadopago', provider_subscription_id: dataId, status, billing_interval: price?.billing_interval, currency: price?.currency, amount_minor: price?.amount_minor, current_period_start: start, current_period_end: end, metadata: { source: 'mercadopago_webhook', provider_status: subscription.status } }
  if (subscriptionId) { const updated = await provider.from('subscriptions').update(row).eq('id', subscriptionId).select('id').maybeSingle(); if (updated.error) return response({ error: 'subscription_update_failed' }, 500) }
  else { const created = await provider.from('subscriptions').insert(row).select('id').single(); if (created.error) return response({ error: 'subscription_create_failed' }, 500); subscriptionId = created.data.id }
  await provider.from('billing_checkout_intents').update({ status: status === 'active' ? 'completed' : 'redirected' }).eq('id', intent.data.id)
  await provider.from('subscription_events').update({ subscription_id: subscriptionId, status: 'processed', processed_at: new Date().toISOString() }).eq('provider_event_id', eventId).eq('provider', 'mercadopago')
  return response({ ok: true, subscriptionId, status })
})

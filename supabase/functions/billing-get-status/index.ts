import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'GET, OPTIONS' }
function response(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'GET') return response({ error: 'method_not_allowed' }, 405)
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!token || !supabaseUrl || !supabaseAnonKey) return response({ error: 'unauthorized' }, 401)
  const client = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } })
  const auth = await client.auth.getUser(token)
  if (auth.error || !auth.data.user) return response({ error: 'unauthorized' }, 401)
  const [subscription, intent] = await Promise.all([
    client.from('subscriptions').select('id, status, provider, provider_subscription_id, plan_id, plan_price_id, billing_interval, currency, amount_minor, current_period_start, current_period_end, cancel_at_period_end, canceled_at, plans(code, name)').in('status', ['pending', 'active', 'past_due', 'paused', 'trialing', 'grace']).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    client.from('billing_checkout_intents').select('id, status, plan_price_id, provider_reference, expires_at, created_at').order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])
  if (subscription.error || intent.error) return response({ error: 'billing_status_unavailable' }, 503)
  return response({ subscription: subscription.data ?? null, latestCheckoutIntent: intent.data ?? null })
})

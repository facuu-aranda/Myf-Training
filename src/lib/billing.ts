import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { PlanCode } from './entitlements'

export interface BillingSubscription {
  id: string
  planCode: PlanCode
  planName: string
  status: string
  interval: 'month' | 'year'
  currency: 'ARS' | 'USD'
  amountMinor: number
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}

export interface PublicPlanPrice {
  id: string
  planCode: PlanCode
  planName: string
  interval: 'month' | 'year'
  currency: 'ARS' | 'USD'
  amountMinor: number
}

export interface CheckoutIntent {
  id: string
  status: 'created' | 'redirected' | 'completed' | 'failed' | 'expired'
  expiresAt: string
  planCode: PlanCode
  planPriceId: string
}

function mapSubscription(row: Record<string, unknown>): BillingSubscription | null {
  const plan = Array.isArray(row.plans) ? row.plans[0] as Record<string, unknown> | undefined : row.plans as Record<string, unknown> | null
  if (!plan || typeof plan.code !== 'string' || typeof row.id !== 'string' || typeof row.plan_price_id !== 'string') return null
  return { id: row.id, planCode: plan.code as PlanCode, planName: String(plan.name ?? plan.code), status: String(row.status ?? 'unknown'), interval: row.billing_interval === 'year' ? 'year' : 'month', currency: row.currency === 'USD' ? 'USD' : 'ARS', amountMinor: Number(row.amount_minor ?? 0), currentPeriodStart: String(row.current_period_start ?? ''), currentPeriodEnd: String(row.current_period_end ?? ''), cancelAtPeriodEnd: Boolean(row.cancel_at_period_end) }
}

export function useBillingSubscription() {
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(supabase))
  const [error, setError] = useState('')
  const refresh = useCallback(async () => {
    if (!supabase) { setIsLoading(false); return }
    const result = await supabase.from('subscriptions').select('id, plan_price_id, status, billing_interval, currency, amount_minor, current_period_start, current_period_end, cancel_at_period_end, plans(code, name)').in('status', ['pending', 'active', 'past_due', 'paused', 'trialing', 'grace']).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (result.error) setError(result.error.message)
    else setSubscription(result.data ? mapSubscription(result.data as Record<string, unknown>) : null)
    setIsLoading(false)
  }, [])
  useEffect(() => { void refresh() }, [refresh])
  const createProviderCheckout = useCallback(async (planPriceId: string) => {
    if (!supabase) throw new Error('billing_not_configured')
    const result = await supabase.functions.invoke<{ intentId: string; providerSubscriptionId: string; redirectUrl: string; environment: string }>('billing-create-checkout', { body: { planPriceId } })
    if (result.error || !result.data?.redirectUrl) throw result.error ?? new Error('provider_checkout_failed')
    return result.data
  }, [])
  const createCheckoutIntent = useCallback(async (planPriceId: string) => {
    if (!supabase) throw new Error('billing_not_configured')
    const result = await supabase.rpc('create_billing_checkout_intent', { target_plan_price_id: planPriceId })
    if (result.error || !result.data || typeof result.data !== 'object') throw result.error ?? new Error('checkout_intent_failed')
    const value = result.data as Record<string, unknown>
    return { id: String(value.id), status: String(value.status) as CheckoutIntent['status'], expiresAt: String(value.expires_at), planCode: String(value.plan_code) as PlanCode, planPriceId: String(value.plan_price_id) }
  }, [])
  return { subscription, isLoading, error, refresh, createCheckoutIntent, createProviderCheckout }
}

export async function loadPublicPlanPrices(): Promise<PublicPlanPrice[]> {
  if (!supabase) return []
  const result = await supabase.from('plan_prices').select('id, billing_interval, currency, amount_minor, plans(code, name)').eq('active', true).eq('currency', 'ARS').order('amount_minor', { ascending: true })
  if (result.error) throw result.error
  return (result.data ?? []).flatMap((row) => {
    const plan = Array.isArray(row.plans) ? row.plans[0] as Record<string, unknown> | undefined : row.plans as Record<string, unknown> | null
    if (!plan || typeof row.id !== 'string' || typeof plan.code !== 'string' || !['month', 'year'].includes(String(row.billing_interval))) return []
    return [{ id: row.id, planCode: plan.code as PlanCode, planName: String(plan.name ?? plan.code), interval: row.billing_interval as 'month' | 'year', currency: row.currency === 'USD' ? 'USD' as const : 'ARS' as const, amountMinor: Number(row.amount_minor ?? 0) }]
  })
}

export function formatMinorAmount(amountMinor: number, currency: 'ARS' | 'USD') {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amountMinor / 100)
}

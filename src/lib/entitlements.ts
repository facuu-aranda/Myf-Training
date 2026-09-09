import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'

export type PlanCode = 'free' | 'plus' | 'couple' | 'household' | 'coach_starter' | 'coach_pro' | 'coach_studio'
export type EntitlementKey =
  | 'ad_free' | 'history_days' | 'progress_ranges' | 'advanced_personal_analytics' | 'ai_monthly_interactions'
  | 'exports_personal' | 'strategy_versions_personal' | 'custom_foods_create' | 'custom_exercises_create'
  | 'household_create' | 'household_max_members' | 'coaching_create' | 'coaching_max_athletes'
  | 'coach_managed_strategy' | 'coach_strategy_manage' | 'coach_progress_view' | 'coach_history_view' | 'coach_notes'
  | 'coach_draft_publish' | 'coach_basic_analytics' | 'coach_advanced_analytics' | 'coach_roster_analytics'
  | 'coach_attention_queue' | 'coach_program_templates' | 'coach_nutrition_templates' | 'coach_duplicate_strategy'
  | 'coach_reports' | 'coach_advanced_exports' | 'coach_custom_exercise_library'

export type EntitlementValue = boolean | number | string | Array<number | string>
export type Entitlements = Partial<Record<EntitlementKey, EntitlementValue>>

export interface AIUsage {
  periodStart: string
  periodEnd: string
  used: number
  limit: number
}

export interface PlanPrice {
  currency: 'ARS' | 'USD'
  interval: 'month' | 'year'
  amountMinor: number
}

export interface CommercialPlan {
  code: PlanCode
  name: string
  description: string
  prices: PlanPrice[]
}

export const COMMERCIAL_PLANS: CommercialPlan[] = [
  { code: 'free', name: 'Free', description: 'Fitness personal esencial', prices: [{ currency: 'ARS', interval: 'month', amountMinor: 0 }, { currency: 'ARS', interval: 'year', amountMinor: 0 }] },
  { code: 'plus', name: 'Plus', description: 'Más profundidad para tu progreso', prices: [{ currency: 'ARS', interval: 'month', amountMinor: 799000 }, { currency: 'ARS', interval: 'year', amountMinor: 7990000 }] },
  { code: 'couple', name: 'Couple', description: 'Beneficios compartidos para dos', prices: [{ currency: 'ARS', interval: 'month', amountMinor: 1399000 }, { currency: 'ARS', interval: 'year', amountMinor: 13990000 }] },
  { code: 'household', name: 'Household', description: 'Una experiencia compartida para cinco', prices: [{ currency: 'ARS', interval: 'month', amountMinor: 2299000 }, { currency: 'ARS', interval: 'year', amountMinor: 22990000 }] },
  { code: 'coach_starter', name: 'Coach Starter', description: 'Coaching real para hasta 10 atletas', prices: [{ currency: 'ARS', interval: 'month', amountMinor: 2999000 }, { currency: 'ARS', interval: 'year', amountMinor: 29990000 }] },
  { code: 'coach_pro', name: 'Coach Pro', description: 'Analítica y eficiencia para hasta 30 atletas', prices: [{ currency: 'ARS', interval: 'month', amountMinor: 5999000 }, { currency: 'ARS', interval: 'year', amountMinor: 59990000 }] },
]

const FREE_ENTITLEMENTS: Entitlements = { ad_free: false, history_days: 30, progress_ranges: [7, 30], ai_monthly_interactions: 0, advanced_personal_analytics: false, exports_personal: false, strategy_versions_personal: false, custom_foods_create: false, custom_exercises_create: false, household_create: false, household_max_members: 0, coaching_create: false, coaching_max_athletes: 0 }

export function hasEntitlement(entitlements: Entitlements, key: EntitlementKey) {
  return entitlements[key] === true || (Array.isArray(entitlements[key]) && entitlements[key].length > 0) || (typeof entitlements[key] === 'number' && entitlements[key] > 0)
}

export function getEntitlementValue<T extends EntitlementValue>(entitlements: Entitlements, key: EntitlementKey, fallback: T) {
  return (entitlements[key] as T | undefined) ?? fallback
}

const PLAN_ENTITLEMENT_CODES: Partial<Record<EntitlementKey, PlanCode[]>> = {
  ad_free: ['plus', 'couple', 'household', 'coach_starter', 'coach_pro'],
  custom_foods_create: ['plus', 'couple', 'household', 'coach_starter', 'coach_pro'],
  custom_exercises_create: ['plus', 'couple', 'household', 'coach_starter', 'coach_pro'],
  household_create: ['couple', 'household'],
  coaching_create: ['coach_starter', 'coach_pro'],
  coach_advanced_analytics: ['coach_pro'],
  coach_program_templates: ['coach_pro'],
  coach_reports: ['coach_pro'],
}

export function getPlansThatGrant(key: EntitlementKey) {
  const codes = PLAN_ENTITLEMENT_CODES[key] ?? COMMERCIAL_PLANS.filter((plan) => plan.code !== 'free' && plan.code !== 'coach_studio').map((plan) => plan.code)
  return COMMERCIAL_PLANS.filter((plan) => codes.includes(plan.code))
}

export function useEntitlements() {
  const [entitlements, setEntitlements] = useState<Entitlements>(FREE_ENTITLEMENTS)
  const [aiUsage, setAIUsage] = useState<AIUsage | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(supabase))
  const refresh = useCallback(async () => {
    if (!supabase) { setEntitlements(FREE_ENTITLEMENTS); setAIUsage(null); setIsLoading(false); return }
    const [entitlementsResult, usageResult] = await Promise.all([supabase.rpc('get_my_effective_entitlements'), supabase.rpc('get_my_ai_usage')])
    if (!entitlementsResult.error && entitlementsResult.data && typeof entitlementsResult.data === 'object') setEntitlements(entitlementsResult.data as Entitlements)
    if (!usageResult.error && usageResult.data && typeof usageResult.data === 'object') {
      const usage = usageResult.data as Record<string, unknown>
      setAIUsage({ periodStart: String(usage.period_start ?? ''), periodEnd: String(usage.period_end ?? ''), used: Number(usage.used ?? 0), limit: Number(usage.limit ?? 0) })
    }
    setIsLoading(false)
  }, [])
  useEffect(() => { void refresh() }, [refresh])
  return useMemo(() => ({ entitlements, aiUsage, isLoading, refresh, has: (key: EntitlementKey) => hasEntitlement(entitlements, key), value: <T extends EntitlementValue>(key: EntitlementKey, fallback: T) => getEntitlementValue(entitlements, key, fallback) }), [aiUsage, entitlements, isLoading, refresh])
}

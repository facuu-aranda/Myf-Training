import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar, GlassCard, LoadingState, SectionHeading, StatusPill } from './ui'
import { buildNutritionComparison, calculateNutritionAdherence, sumNutritionComparison } from '../lib/nutrition-analytics'
import { loadFoodLogsInRange, loadMealPlansForHousehold, loadSharedFoodLogs, loadUserHouseholdId } from '../lib/repository'
import { subscribeToNutritionChanges } from '../lib/supabase'
import { formatNumber, getDateKey, getStartOfWeek } from '../lib/utils'
import type { Profile } from '../types'

interface PersonNutritionSummary {
  profile: Profile
  plannedCalories: number
  loggedCalories: number
  plannedProtein: number
  loggedProtein: number
  adherence: number | null
  plannedMeals: number
  loggedMeals: number
  sharedActual: boolean
}

function addDays(date: Date, amount: number) { const result = new Date(date); result.setDate(result.getDate() + amount); return result }

export function CoupleNutritionPanel({ userId, profiles }: { userId: string; profiles: Profile[] }) {
  const { t } = useTranslation()
  const [summaries, setSummaries] = useState<PersonNutritionSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [start] = useState(() => getStartOfWeek())
  const startsOn = getDateKey(start)
  const endsOn = getDateKey(addDays(start, 6))

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const householdId = await loadUserHouseholdId(userId)
      if (!householdId) { setSummaries([]); return }
      const [plans, ownLogs, sharedLogs] = await Promise.all([loadMealPlansForHousehold(userId, householdId, startsOn, endsOn), loadFoodLogsInRange(userId, startsOn, endsOn), loadSharedFoodLogs(householdId, startsOn, endsOn)])
      const next = profiles.map((profile) => {
        const profilePlans = plans.filter((plan) => plan.userId === profile.id)
        const profileLogs = profile.id === userId ? ownLogs : sharedLogs.filter((log) => log.userId === profile.id)
        const planned = profilePlans.flatMap((plan) => plan.days.flatMap((day) => day.meals.map((meal) => ({ date: day.planDate, meal }))))
        const comparisons = buildNutritionComparison(Array.from({ length: 7 }, (_, index) => getDateKey(addDays(start, index))), planned, profileLogs)
        const total = sumNutritionComparison(comparisons)
        return { profile, plannedCalories: total.planned.calories, loggedCalories: total.logged.calories, plannedProtein: total.planned.proteinG, loggedProtein: total.logged.proteinG, adherence: calculateNutritionAdherence(total.planned.calories, total.logged.calories), plannedMeals: total.plannedMealCount, loggedMeals: total.calculableLoggedMealCount, sharedActual: profile.id === userId || profileLogs.length > 0 }
      })
      setSummaries(next)
    } catch { setError(t('household.nutritionError')) } finally { setIsLoading(false) }
  }, [endsOn, profiles, start, startsOn, t, userId])

  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => { const unsubscribe = subscribeToNutritionChanges(() => { void refresh() }); return unsubscribe }, [refresh])

  if (isLoading) return <section className="couple-nutrition"><LoadingState /></section>
  if (error) return <section className="couple-nutrition"><div className="inline-error" role="alert">{error}</div></section>
  if (!summaries.length) return null
  return <section className="couple-nutrition"><div className="couple-nutrition-heading"><SectionHeading eyebrow={t('household.nutrition')} title={t('household.nutrition')} /><StatusPill tone="violet">{t('household.nutritionSubtitle')}</StatusPill></div><div className="couple-nutrition-grid">{summaries.map((summary) => <GlassCard className="couple-nutrition-person" key={summary.profile.id}><div className="couple-nutrition-person-head"><Avatar src={summary.profile.avatarUrl} name={summary.profile.displayName} size="md" online /><div><strong>{summary.profile.displayName}</strong><span>{summary.sharedActual ? t('household.sharedNutrition') : t('household.privateNutrition')}</span></div></div><div className="couple-nutrition-calories"><span>{t('nutrition.logged')} / {t('nutrition.planned')}</span><strong>{formatNumber(summary.loggedCalories, 0)} <small>/ {formatNumber(summary.plannedCalories, 0)} kcal</small></strong></div><div className="couple-nutrition-macros"><div><span>{t('nutrition.protein')}</span><strong>{formatNumber(summary.loggedProtein, 1)}g <small>/ {formatNumber(summary.plannedProtein, 1)}g</small></strong></div><div><span>{t('nutrition.meals')}</span><strong>{summary.loggedMeals} <small>/ {summary.plannedMeals}</small></strong></div></div><div className="couple-nutrition-footer"><span>{t('nutrition.adherence')}</span><strong>{summary.adherence === null ? '—' : `${formatNumber(summary.adherence, 1)}%`}</strong></div>{!summary.sharedActual && <p className="couple-nutrition-note">{t('household.noSharedNutrition')}</p>}</GlassCard>)}</div></section>
}

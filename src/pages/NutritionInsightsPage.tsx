import { BarChart3, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Target, TrendingDown, TrendingUp } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageMotion } from '../components/PageMotion'
import { NutritionSubnav } from '../components/NutritionSubnav'
import { EmptyState, GlassCard, IconButton, LoadingState, MetricCard, StatusPill } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { buildNutritionComparison, calculateNutritionAdherence, sumNutritionComparison, type NutritionDayComparison } from '../lib/nutrition-analytics'
import { loadFoodLogsInRange, loadMealPlansForUser } from '../lib/repository'
import { subscribeToNutritionChanges } from '../lib/supabase'
import { formatDate, formatNumber, getDateKey, getStartOfWeek } from '../lib/utils'

const ranges = [7, 28] as const
type Range = typeof ranges[number]
const chartStyle = { background: '#1b1528', border: '1px solid rgba(184,131,255,.22)', borderRadius: 10, color: '#eee5f7', fontSize: 10 }

function addDays(date: Date, amount: number) { const result = new Date(date); result.setDate(result.getDate() + amount); return result }
function signed(value: number, digits = 0) { return `${value > 0 ? '+' : ''}${formatNumber(value, digits)}` }
function nutritionPercent(value: number, target: number) { return target > 0 ? Math.min(100, value / target * 100) : 0 }
function dateLabel(date: string, locale: string) { return new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00`)) }

export function NutritionInsightsPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const language = i18n.language.startsWith('es') ? 'es' : 'en'
  const locale = language === 'es' ? 'es-AR' : 'en-US'
  const [range, setRange] = useState<Range>(7)
  const [periodStart, setPeriodStart] = useState(() => getStartOfWeek())
  const [days, setDays] = useState<NutritionDayComparison[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const startsOn = getDateKey(periodStart)
  const endsOn = getDateKey(addDays(periodStart, range - 1))

  const refresh = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError('')
    try {
      const [plans, logs] = await Promise.all([loadMealPlansForUser(user.id, startsOn, endsOn), loadFoodLogsInRange(user.id, startsOn, endsOn)])
      const planned = plans.flatMap((plan) => plan.days.flatMap((day) => day.meals.map((meal) => ({ date: day.planDate, meal }))))
      const dateKeys = Array.from({ length: range }, (_, index) => getDateKey(addDays(periodStart, index)))
      setDays(buildNutritionComparison(dateKeys, planned, logs))
    } catch { setError(t('nutrition.insightsError')) } finally { setIsLoading(false) }
  }, [endsOn, periodStart, range, startsOn, t, user])

  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => { const unsubscribe = subscribeToNutritionChanges(() => { void refresh() }); return unsubscribe }, [refresh])

  const summary = useMemo(() => sumNutritionComparison(days), [days])
  const adherence = calculateNutritionAdherence(summary.planned.calories, summary.logged.calories)
  const mealAdherence = summary.plannedMealCount ? Math.round(summary.completedMealCount / summary.plannedMealCount * 1000) / 10 : null
  const chartData = days.map((day) => ({ date: dateLabel(day.date, locale), planned: Math.round(day.planned.calories), logged: Math.round(day.logged.calories) }))
  const periodLabel = `${formatDate(periodStart, locale, { month: 'short', day: 'numeric' })} – ${formatDate(addDays(periodStart, range - 1), locale, { month: 'short', day: 'numeric', year: 'numeric' })}`
  const hasData = summary.plannedMealCount > 0 || summary.loggedMealCount > 0

  const shiftPeriod = (amount: number) => setPeriodStart((current) => addDays(current, amount * range))
  if (!user) return null
  return <PageMotion><div className="page-header"><div><span className="eyebrow-label">{t('nav.nutrition')}</span><h1>{t('nutrition.insights')}</h1><p>{t('nutrition.insightsSubtitle')}</p></div><div className="nutrition-insights-header"><StatusPill tone="violet"><CalendarDays size={13} />{periodLabel}</StatusPill><div className="range-tabs" aria-label={t('nutrition.insightsRange')}>{ranges.map((value) => <button type="button" key={value} className={range === value ? 'active' : ''} onClick={() => setRange(value)}>{value === 7 ? t('nutrition.sevenDays') : t('nutrition.twentyEightDays')}</button>)}</div></div></div><NutritionSubnav />{error && <div className="inline-error" role="alert">{error}</div>}{isLoading ? <LoadingState /> : !hasData ? <GlassCard><EmptyState icon={<BarChart3 size={20} />} title={t('nutrition.noInsights')} description={t('nutrition.insightsSubtitle')} /></GlassCard> : <section className="nutrition-insights"><div className="nutrition-insights-toolbar"><div className="week-navigation"><IconButton type="button" label={t('common.previous')} onClick={() => shiftPeriod(-1)}><ChevronLeft size={16} /></IconButton><strong>{periodLabel}</strong><IconButton type="button" label={t('common.next')} onClick={() => shiftPeriod(1)}><ChevronRight size={16} /></IconButton></div><span>{summary.calculableLoggedMealCount < summary.loggedMealCount ? t('nutrition.incompleteInsights') : t('nutrition.completeInsights')}</span></div><div className="nutrition-insights-summary"><MetricCard label={t('nutrition.planned')} value={`${formatNumber(summary.planned.calories, 0)} kcal`} target={t('nutrition.insightsPeriod')} icon={<Target size={15} />} detail={<>{summary.plannedMealCount} {t('nutrition.planned').toLowerCase()}</>} accent="violet" /><MetricCard label={t('nutrition.logged')} value={`${formatNumber(summary.logged.calories, 0)} kcal`} target={t('nutrition.insightsPeriod')} icon={<CheckCircle2 size={15} />} detail={<>{summary.calculableLoggedMealCount} / {summary.loggedMealCount} {t('nutrition.meals').toLowerCase()}</>} accent="cyan" /><MetricCard label={t('nutrition.delta')} value={`${signed(summary.delta.calories)} kcal`} target={t('nutrition.loggedMinusPlanned')} icon={summary.delta.calories > 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />} detail={<>{t('nutrition.plannedVsActual')}</>} accent={summary.delta.calories > 0 ? 'orange' : 'pink'} /><MetricCard label={t('nutrition.adherence')} value={adherence === null ? '—' : `${formatNumber(adherence, 1)}%`} progress={adherence ?? undefined} icon={<BarChart3 size={15} />} detail={<>{mealAdherence === null ? '—' : `${formatNumber(mealAdherence, 1)}% ${t('nutrition.mealAdherence').toLowerCase()}`}</>} accent="violet" /></div><div className="nutrition-macro-comparison"><MacroComparison label={t('nutrition.protein')} planned={summary.planned.proteinG} logged={summary.logged.proteinG} unit="g" t={t} /><MacroComparison label={t('nutrition.carbs')} planned={summary.planned.carbohydratesG} logged={summary.logged.carbohydratesG} unit="g" t={t} /><MacroComparison label={t('nutrition.fat')} planned={summary.planned.fatG} logged={summary.logged.fatG} unit="g" t={t} /></div><GlassCard className="chart-card chart-card-wide"><div className="chart-title"><div><h2>{t('nutrition.calorieBalance')}</h2><p>{t('nutrition.plannedVsActual')}</p></div><div className="chart-legend"><span><i />{t('nutrition.planned')}</span><span><i className="cyan-dot" />{t('nutrition.logged')}</span></div></div><div className="nutrition-insights-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}><CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} /><XAxis dataKey="date" tick={{ fill: '#887d96', fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: '#887d96', fontSize: 9 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={chartStyle} /><Bar dataKey="planned" fill="#a77bf1" radius={[4, 4, 0, 0]} /><Bar dataKey="logged" fill="#6ee7f9" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></GlassCard><div className="nutrition-daily-list"><div className="chart-title"><div><h2>{t('nutrition.dailyBreakdown')}</h2><p>{t('nutrition.dailyBreakdownHint')}</p></div></div>{days.map((day) => <NutritionDayRow key={day.date} day={day} locale={locale} t={t} />)}</div></section>}</PageMotion>
}

function MacroComparison({ label, planned, logged, unit, t }: { label: string; planned: number; logged: number; unit: string; t: (key: string) => string }) {
  const target = Math.max(planned, logged, 1)
  return <GlassCard className="nutrition-macro-card"><div><span>{label}</span><strong>{formatNumber(logged, 1)}<small>{unit} / {formatNumber(planned, 1)}{unit}</small></strong></div><div className="macro-bars"><span className="macro-bar-planned" style={{ width: `${nutritionPercent(planned, target)}%` }} /><span className="macro-bar-logged" style={{ width: `${nutritionPercent(logged, target)}%` }} /></div><small>{t('nutrition.loggedMinusPlanned')}: {logged - planned > 0 ? '+' : ''}{formatNumber(logged - planned, 1)}{unit}</small></GlassCard>
}

function NutritionDayRow({ day, locale, t }: { day: NutritionDayComparison; locale: string; t: (key: string) => string }) {
  const difference = day.delta.calories
  return <div className="nutrition-day-row"><div className="nutrition-day-date"><strong>{new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(`${day.date}T12:00:00`))}</strong><span>{new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(`${day.date}T12:00:00`))}</span></div><div className="nutrition-day-values"><span><small>{t('nutrition.planned')}</small><strong>{formatNumber(day.planned.calories, 0)} kcal</strong></span><span><small>{t('nutrition.logged')}</small><strong>{formatNumber(day.logged.calories, 0)} kcal</strong></span><span className={difference > 0 ? 'positive' : difference < 0 ? 'negative' : ''}><small>{t('nutrition.delta')}</small><strong>{signed(difference)} kcal</strong></span></div><div className="nutrition-day-meals"><span>{day.completedMealCount}/{day.plannedMealCount} {t('nutrition.planned').toLowerCase()}</span><span>{day.calculableLoggedMealCount}/{day.loggedMealCount} {t('nutrition.logged').toLowerCase()}</span></div></div>
}

import { CalendarDays, ChevronLeft, ChevronRight, Copy, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { PageMotion } from '../components/PageMotion'
import { NutritionSubnav } from '../components/NutritionSubnav'
import { Field, IconButton, LoadingState, Modal, NeonButton, SelectField, StatusPill, TextAreaField } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useFitness } from '../hooks/useFitness'
import { calculateNutrition, calculateRecipeNutrition, scaleNutrition } from '../lib/nutrition'
import { localizedFoodCategory, localizedFoodName } from '../lib/food'
import { subscribeToNutritionChanges } from '../lib/supabase'
import { loadMealPlan, loadRecipes, loadUserCoupleId, saveMealPlan, searchFoods } from '../lib/repository'
import { formatDate, formatNumber, getDateKey, getStartOfWeek, uid } from '../lib/utils'
import type { Food, FoodPortion, FoodUnit, MealPlan, MealPlanDay, MealType, PlannedMeal, Recipe } from '../types'

interface PlannedMealDraft {
  id: string
  mealPlanDayId: string
  mealType: MealType
  scheduledTime: string
  source: 'food' | 'recipe' | 'flexible'
  food: Food | null
  recipe: Recipe | null
  quantity: string
  unit: FoodUnit
  portion: FoodPortion | null
  servings: string
  plannedCalories: string
  notes: string
  status: PlannedMeal['status']
  completedAt: string | null
  loggedAt: string | null
}

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout', 'other']

function addDays(date: Date, amount: number) { const result = new Date(date); result.setDate(result.getDate() + amount); return result }
function emptyPlan(userId: string, coupleId: string | null, start: Date): MealPlan { const startsOn = getDateKey(start); const days = Array.from({ length: 7 }, (_, index) => ({ id: uid('plan-day'), mealPlanId: '', planDate: getDateKey(addDays(start, index)), notes: '', meals: [], createdAt: '', updatedAt: '' } satisfies MealPlanDay)); const planId = uid('meal-plan'); return { id: planId, userId, coupleId, name: 'Weekly nutrition plan', startsOn, endsOn: getDateKey(addDays(start, 6)), visibility: 'private', days: days.map((day) => ({ ...day, mealPlanId: planId })), createdAt: '', updatedAt: '' } }
function blankMeal(dayId: string): PlannedMealDraft { return { id: uid('planned-meal'), mealPlanDayId: dayId, mealType: 'lunch', scheduledTime: '12:00', source: 'food', food: null, recipe: null, quantity: '100', unit: 'g', portion: null, servings: '1', plannedCalories: '', notes: '', status: 'planned', completedAt: null, loggedAt: null } }
function draftFromMeal(meal: PlannedMeal, recipes: Recipe[]): PlannedMealDraft { const recipe = meal.recipe ? recipes.find((item) => item.id === meal.recipe?.id) ?? meal.recipe : null; return { id: meal.id, mealPlanDayId: meal.mealPlanDayId, mealType: meal.mealType, scheduledTime: meal.scheduledTime ?? '12:00', source: meal.food ? 'food' : recipe ? 'recipe' : 'flexible', food: meal.food ?? null, recipe, quantity: meal.quantity === null ? '100' : String(meal.quantity), unit: meal.unit ?? 'g', portion: null, servings: meal.servings === null ? '1' : String(meal.servings), plannedCalories: meal.plannedCalories === null ? '' : String(meal.plannedCalories), notes: meal.notes, status: meal.status, completedAt: meal.completedAt, loggedAt: meal.loggedAt } }
function mealLabel(type: MealType, t: (key: string) => string) { return t(`nutrition.mealTypes.${type}`) }

function recipePerServing(recipe: Recipe) {
  const items = recipe.ingredients.flatMap((ingredient) => { const nutrients = ingredient.food?.nutrients.find((item) => item.basis === 'per_100g'); return nutrients ? [{ nutrients, quantity: ingredient.quantity, unit: ingredient.unit, portion: ingredient.portion }] : [] })
  if (items.length !== recipe.ingredients.length || !items.length) return null
  try { return calculateRecipeNutrition(items, recipe.servings) } catch { return null }
}

export function MealPlannerPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { nutritionPlans } = useFitness()
  const language = i18n.language.startsWith('es') ? 'es' : 'en'
  const locale = language === 'es' ? 'es-AR' : 'en-US'
  const [weekStart, setWeekStart] = useState(() => getStartOfWeek())
  const startsOn = getDateKey(weekStart)
  const endsOn = getDateKey(addDays(weekStart, 6))
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [editor, setEditor] = useState<PlannedMealDraft | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const target = nutritionPlans.find((item) => item.userId === user?.id)

  const refresh = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError('')
    try {
      const [remotePlan, nextRecipes, nextCoupleId] = await Promise.all([loadMealPlan(user.id, startsOn, endsOn), loadRecipes(), loadUserCoupleId(user.id)])
      setRecipes(nextRecipes)
      setPlan(remotePlan ?? emptyPlan(user.id, nextCoupleId, weekStart))
    } catch { setError(t('nutrition.plannedMealError')) } finally { setIsLoading(false) }
  }, [endsOn, startsOn, t, user, weekStart])

  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => { const unsubscribe = subscribeToNutritionChanges(() => { void refresh() }); return unsubscribe }, [refresh])

  const persist = async (nextPlan: MealPlan) => {
    setSaving(true)
    setError('')
    try { await saveMealPlan(nextPlan); setPlan(nextPlan); setEditor(null) } catch { setError(t('nutrition.plannedMealError')) } finally { setSaving(false) }
  }

  const saveMeal = async (meal: PlannedMeal) => {
    if (!plan) return
    const withoutMeal = plan.days.map((day) => ({ ...day, meals: day.meals.filter((item) => item.id !== meal.id) }))
    const nextPlan = { ...plan, days: withoutMeal.map((day) => day.id === meal.mealPlanDayId ? { ...day, meals: [...day.meals, meal] } : day) }
    await persist(nextPlan)
  }

  const duplicateMeal = async (meal: PlannedMeal) => {
    const duplicate = { ...meal, id: uid('planned-meal'), status: 'planned' as const, completedAt: null, loggedAt: null }
    await saveMeal(duplicate)
  }

  const removeMeal = async (meal: PlannedMeal) => {
    if (!plan || !window.confirm(t('nutrition.deleteMealConfirm'))) return
    const nextPlan = { ...plan, days: plan.days.map((day) => ({ ...day, meals: day.meals.filter((item) => item.id !== meal.id) })) }
    await persist(nextPlan)
  }

  const shiftWeek = (amount: number) => setWeekStart((current) => addDays(current, amount * 7))
  const weekLabel = `${formatDate(weekStart, locale, { month: 'short', day: 'numeric' })} – ${formatDate(addDays(weekStart, 6), locale, { month: 'short', day: 'numeric', year: 'numeric' })}`
  const weekMeals = plan?.days.flatMap((day) => day.meals) ?? []
  const plannedCalories = weekMeals.reduce((sum, meal) => sum + (meal.plannedCalories ?? 0), 0)

  if (!user) return null
  return <PageMotion><div className="page-header"><div><span className="eyebrow-label">{t('nav.nutrition')}</span><h1>{t('nutrition.planner')}</h1><p>{t('nutrition.plannerSubtitle')}</p></div><div className="meal-planner-header"><StatusPill tone="violet"><CalendarDays size={13} />{weekMeals.length} {t('nutrition.planned').toLowerCase()}</StatusPill><span>{formatNumber(plannedCalories, 0)} kcal</span></div></div><NutritionSubnav /><section className="meal-planner"><div className="meal-planner-toolbar"><div className="week-navigation"><IconButton type="button" label={t('nutrition.previousWeek')} onClick={() => shiftWeek(-1)}><ChevronLeft size={16} /></IconButton><strong>{weekLabel}</strong><IconButton type="button" label={t('nutrition.nextWeek')} onClick={() => shiftWeek(1)}><ChevronRight size={16} /></IconButton></div><div className="meal-planner-target">{target ? `${formatNumber(target.calories, 0)} kcal / day` : t('nutrition.flexibleMeal')}</div></div>{error && <div className="inline-error" role="alert">{error}</div>}{isLoading ? <LoadingState /> : plan && <div className="meal-week-grid">{plan.days.map((day) => <MealPlanDayCard key={day.id} day={day} language={language} locale={locale} t={t} onAdd={() => setEditor(blankMeal(day.id))} onEdit={(meal) => setEditor(draftFromMeal(meal, recipes))} onDuplicate={(meal) => { void duplicateMeal(meal) }} onDelete={(meal) => { void removeMeal(meal) }} />)}</div>}<Modal open={Boolean(editor)} onClose={() => { if (!saving) setEditor(null) }} title={t('nutrition.addPlannedMeal')} size="lg">{editor && <PlannedMealEditor initial={editor} days={plan?.days ?? []} recipes={recipes} language={language} saving={saving} onCancel={() => setEditor(null)} onSave={saveMeal} t={t} />}</Modal></section></PageMotion>
}

function MealPlanDayCard({ day, language, locale, t, onAdd, onEdit, onDuplicate, onDelete }: { day: MealPlanDay; language: 'en' | 'es'; locale: string; t: (key: string) => string; onAdd: () => void; onEdit: (meal: PlannedMeal) => void; onDuplicate: (meal: PlannedMeal) => void; onDelete: (meal: PlannedMeal) => void }) {
  const date = new Date(`${day.planDate}T12:00:00`)
  const meals = day.meals.slice().sort((left, right) => (left.scheduledTime ?? '').localeCompare(right.scheduledTime ?? ''))
  return <article className="meal-day-card"><div className="meal-day-head"><div><span>{new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date)}</span><strong>{new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(date)}</strong></div><IconButton type="button" label={t('nutrition.addPlannedMeal')} onClick={onAdd}><Plus size={15} /></IconButton></div>{meals.length ? <div className="planned-meal-list">{meals.map((meal) => <PlannedMealCard key={meal.id} meal={meal} language={language} t={t} onEdit={() => onEdit(meal)} onDuplicate={() => onDuplicate(meal)} onDelete={() => onDelete(meal)} />)}</div> : <button type="button" className="meal-day-empty" onClick={onAdd}><Plus size={13} />{t('nutrition.noPlannedMeals')}</button>}</article>
}

function PlannedMealCard({ meal, language, t, onEdit, onDuplicate, onDelete }: { meal: PlannedMeal; language: 'en' | 'es'; t: (key: string) => string; onEdit: () => void; onDuplicate: () => void; onDelete: () => void }) {
  const title = meal.food ? localizedFoodName(meal.food, language) : meal.recipe ? (language === 'es' ? meal.recipe.nameEs || meal.recipe.name : meal.recipe.name) : t('nutrition.flexibleMeal')
  const quantity = meal.food && meal.quantity !== null ? `${formatNumber(meal.quantity, 1)} ${meal.unit}` : meal.recipe && meal.servings !== null ? `${formatNumber(meal.servings, 1)} ${t('nutrition.servings').toLowerCase()}` : `${t('nutrition.plannedCalories')}: ${formatNumber(meal.plannedCalories ?? 0, 0)} kcal`
  return <div className="planned-meal-card"><button type="button" className="planned-meal-main" onClick={onEdit}><span className="planned-meal-type">{mealLabel(meal.mealType, t)}{meal.scheduledTime && <small>{meal.scheduledTime.slice(0, 5)}</small>}</span><strong>{title}</strong><span>{quantity}</span></button><div className="planned-meal-meta"><span>{meal.plannedCalories !== null ? `${formatNumber(meal.plannedCalories, 0)} kcal` : '—'}</span><div><IconButton type="button" label={t('nutrition.duplicatePlannedMeal')} onClick={onDuplicate}><Copy size={12} /></IconButton><IconButton type="button" label={t('nutrition.deletePlannedMeal')} onClick={onDelete}><Trash2 size={12} /></IconButton></div></div></div>
}

function PlannedMealEditor({ initial, days, recipes, language, saving, onCancel, onSave, t }: { initial: PlannedMealDraft; days: MealPlanDay[]; recipes: Recipe[]; language: 'en' | 'es'; saving: boolean; onCancel: () => void; onSave: (meal: PlannedMeal) => Promise<void>; t: (key: string) => string }) {
  const [draft, setDraft] = useState(initial)
  const [foodSearch, setFoodSearch] = useState('')
  const [foodResults, setFoodResults] = useState<Food[]>([])
  const [validation, setValidation] = useState('')

  useEffect(() => {
    let active = true
    if (draft.source !== 'food' || !foodSearch.trim()) { setFoodResults([]); return () => { active = false } }
    const timer = window.setTimeout(() => { void searchFoods(foodSearch, 20).then((results) => { if (active) setFoodResults(results) }).catch(() => { if (active) setFoodResults([]) }) }, 180)
    return () => { active = false; window.clearTimeout(timer) }
  }, [draft.source, foodSearch])

  const update = <K extends keyof PlannedMealDraft>(key: K, value: PlannedMealDraft[K]) => setDraft((current) => ({ ...current, [key]: value }))
  const chooseFood = (food: Food) => { update('food', food); update('recipe', null); update('unit', food.defaultUnit); update('portion', food.portions.find((portion) => portion.isDefault) ?? food.portions[0] ?? null); setFoodSearch(''); setFoodResults([]) }
  const chooseRecipe = (recipeId: string) => { const recipe = recipes.find((item) => item.id === recipeId) ?? null; update('recipe', recipe); update('food', null); update('servings', '1') }
  const units = draft.food ? [...new Set<FoodUnit>([draft.food.defaultUnit, ...draft.food.portions.map((portion) => portion.unit)])] : ['g' as FoodUnit]
  const foodNutrients = draft.food?.nutrients.find((item) => item.basis === 'per_100g')
  const recipeNutrients = draft.recipe ? recipePerServing(draft.recipe) : null
  const preview = draft.source === 'food' && foodNutrients && Number(draft.quantity) > 0 ? (() => { try { return calculateNutrition(foodNutrients, Number(draft.quantity), draft.unit, draft.portion ?? undefined) } catch { return null } })() : draft.source === 'recipe' && recipeNutrients && Number(draft.servings) > 0 ? scaleNutrition(recipeNutrients, Number(draft.servings)) : null

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const quantity = Number(draft.quantity)
    const servings = Number(draft.servings)
    if (draft.source === 'food' && (!draft.food || !Number.isFinite(quantity) || quantity <= 0)) { setValidation(t('nutrition.quantity')); return }
    if (draft.source === 'recipe' && (!draft.recipe || !Number.isFinite(servings) || servings <= 0)) { setValidation(t('nutrition.chooseRecipe')); return }
    if (draft.source === 'recipe' && !preview) { setValidation(t('nutrition.noNutrition')); return }
    if (draft.source === 'flexible' && (!Number.isFinite(Number(draft.plannedCalories)) || Number(draft.plannedCalories) <= 0)) { setValidation(t('nutrition.plannedCalories')); return }
    const meal: PlannedMeal = { id: draft.id, mealPlanDayId: draft.mealPlanDayId, mealType: draft.mealType, scheduledTime: draft.scheduledTime || null, foodId: draft.source === 'food' && draft.food ? draft.food.id : null, recipeId: draft.source === 'recipe' && draft.recipe ? draft.recipe.id : null, quantity: draft.source === 'food' ? quantity : null, unit: draft.source === 'food' ? draft.unit : null, servings: draft.source === 'recipe' ? servings : null, plannedCalories: preview?.calories ?? (draft.source === 'flexible' ? Number(draft.plannedCalories) : null), plannedProteinG: preview?.proteinG ?? null, plannedCarbohydratesG: preview?.carbohydratesG ?? null, plannedFatG: preview?.fatG ?? null, plannedFiberG: preview?.fiberG ?? null, notes: draft.notes, status: draft.status, completedAt: draft.completedAt, loggedAt: draft.loggedAt, food: draft.source === 'food' ? draft.food ?? undefined : undefined, recipe: draft.source === 'recipe' ? draft.recipe ?? undefined : undefined, createdAt: '', updatedAt: '' }
    void onSave(meal)
  }

  return <form className="meal-editor" onSubmit={submit}><div className="settings-grid"><SelectField label={t('nutrition.planDay')} value={draft.mealPlanDayId} onChange={(event) => update('mealPlanDayId', event.target.value)}>{days.map((day) => <option key={day.id} value={day.id}>{day.planDate}</option>)}</SelectField><SelectField label={t('nutrition.mealType')} value={draft.mealType} onChange={(event) => update('mealType', event.target.value as MealType)}>{mealTypes.map((type) => <option key={type} value={type}>{mealLabel(type, t)}</option>)}</SelectField><Field label={t('nutrition.time')} type="time" value={draft.scheduledTime} onChange={(event) => update('scheduledTime', event.target.value)} /><SelectField label={t('nutrition.source')} value={draft.source} onChange={(event) => { const source = event.target.value as PlannedMealDraft['source']; update('source', source); if (source === 'flexible') { update('food', null); update('recipe', null) } }}>{<option value="food">{t('nutrition.chooseFood')}</option>}<option value="recipe">{t('nutrition.recipes')}</option><option value="flexible">{t('nutrition.flexibleMeal')}</option></SelectField></div>{draft.source === 'food' && <div className="meal-editor-food"><div className="selected-food">{draft.food ? <button type="button" className="recipe-food-selected" onClick={() => { update('food', null); setFoodSearch('') }}>{localizedFoodName(draft.food, language)}</button> : <Field label={t('nutrition.chooseFood')} value={foodSearch} onChange={(event) => setFoodSearch(event.target.value)} placeholder={t('nutrition.searchFood')} />}</div>{foodResults.length > 0 && <div className="planner-food-results">{foodResults.map((food) => <button type="button" key={food.id} onClick={() => chooseFood(food)}><strong>{localizedFoodName(food, language)}</strong><small>{localizedFoodCategory(food, language)} · {food.nutrients.find((item) => item.basis === 'per_100g')?.calories ?? '—'} kcal / 100 g</small></button>)}</div>}{draft.food && <div className="settings-grid"><Field label={t('nutrition.quantity')} type="number" min="0" step="0.1" value={draft.quantity} onChange={(event) => update('quantity', event.target.value)} /><SelectField label={t('nutrition.unit')} value={draft.unit} onChange={(event) => update('unit', event.target.value as FoodUnit)}>{units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</SelectField></div>}</div>}{draft.source === 'recipe' && <SelectField label={t('nutrition.chooseRecipe')} value={draft.recipe?.id ?? ''} onChange={(event) => chooseRecipe(event.target.value)}><option value="">{t('nutrition.chooseRecipe')}</option>{recipes.map((recipe) => <option key={recipe.id} value={recipe.id}>{language === 'es' ? recipe.nameEs || recipe.name : recipe.name}</option>)}</SelectField>}{draft.source === 'recipe' && draft.recipe && <Field label={t('nutrition.servings')} type="number" min="0.5" step="0.5" value={draft.servings} onChange={(event) => update('servings', event.target.value)} />}{draft.source === 'flexible' && <Field label={t('nutrition.plannedCalories')} type="number" min="0" value={draft.plannedCalories} onChange={(event) => update('plannedCalories', event.target.value)} />}{preview && <div className="meal-preview"><strong>{formatNumber(preview.calories, 0)} kcal</strong><span>{formatNumber(preview.proteinG, 1)}g {t('nutrition.protein').toLowerCase()}</span><span>{formatNumber(preview.carbohydratesG, 1)}g {t('nutrition.carbs').toLowerCase()}</span><span>{formatNumber(preview.fatG, 1)}g {t('nutrition.fat').toLowerCase()}</span></div>}<TextAreaField label={t('strategy.notes')} value={draft.notes} onChange={(event) => update('notes', event.target.value)} />{validation && <div className="inline-error" role="alert">{validation}</div>}<div className="modal-actions"><NeonButton type="button" variant="ghost" onClick={onCancel} disabled={saving}>{t('common.cancel')}</NeonButton><NeonButton type="submit" loading={saving}>{t('nutrition.addPlannedMeal')}</NeonButton></div></form>
}

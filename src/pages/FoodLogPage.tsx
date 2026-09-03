import { Plus, Trash2, Utensils } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { PageMotion } from '../components/PageMotion'
import { NutritionSubnav } from '../components/NutritionSubnav'
import { GlassCard, EmptyState, Field, IconButton, LoadingState, Modal, NeonButton, SectionHeading, SelectField, TextAreaField } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useFitness } from '../hooks/useFitness'
import { useFoodLog } from '../hooks/useFoodLog'
import { calculateDailyNutrition, calculateFoodLogNutrition, calculateMealNutrition, calculateRecipeNutrition, normalizeQuantity, scaleNutrition } from '../lib/nutrition'
import { localizedFoodCategory, localizedFoodName } from '../lib/food'
import { loadRecipes, loadUserHouseholdId, searchFoods } from '../lib/repository'
import { formatNumber, getDateKey } from '../lib/utils'
import type { Food, FoodLog, FoodLogItem, FoodPortion, FoodUnit, MealType, Recipe } from '../types'

interface LogDraftItem {
  id: string
  source: 'food' | 'recipe'
  food: Food | null
  recipe: Recipe | null
  quantity: string
  unit: FoodUnit
  portion: FoodPortion | null
  notes: string
}

interface LogDraft {
  id: string
  userId: string
  householdId: string | null
  visibility: 'private' | 'household'
  consumedOn: string
  consumedAt: string
  mealType: MealType
  notes: string
  items: LogDraftItem[]
}

function localDateTimeValue(date = new Date()) { return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16) }
function emptyLog(userId: string, date: string, householdId: string | null): LogDraft { return { id: crypto.randomUUID(), userId, householdId, visibility: 'private', consumedOn: date, consumedAt: localDateTimeValue(), mealType: 'other', notes: '', items: [] } }
function localizedMealType(type: MealType, t: (key: string) => string) { return t(`nutrition.mealTypes.${type}`) }
function localizedRecipeName(recipe: Recipe, language: 'en' | 'es') { return language === 'es' ? recipe.nameEs || recipe.name : recipe.name }
function logNutrition(log: FoodLog) { return calculateFoodLogNutrition(log) }

export function FoodLogPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { nutritionPlans } = useFitness()
  const [date, setDate] = useState(getDateKey())
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const { logs, isLoading, error, save, remove } = useFoodLog(user?.id, date)
  useEffect(() => { if (user) void Promise.all([loadUserHouseholdId(user.id), loadRecipes()]).then(([nextHouseholdId, nextRecipes]) => { setHouseholdId(nextHouseholdId); setRecipes(nextRecipes) }).catch(() => { setHouseholdId(null); setRecipes([]) }) }, [user])
  const [editor, setEditor] = useState<LogDraft | null>(null)
  const [saving, setSaving] = useState(false)
  const language = i18n.language.startsWith('es') ? 'es' : 'en'
  const plan = nutritionPlans.find((item) => item.userId === user?.id)
  const dailyNutrition = useMemo(() => calculateDailyNutrition(logs.flatMap((log) => { const nutrition = logNutrition(log); return nutrition ? [nutrition] : [] })), [logs])

  const deleteLog = async (log: FoodLog) => { if (!window.confirm(t('nutrition.deleteMealConfirm'))) return; try { await remove(log.id) } catch { return } }
  const saveLog = async (draft: FoodLog) => { setSaving(true); try { await save(draft); setEditor(null) } catch { return } finally { setSaving(false) } }

  if (!user) return null
  return <PageMotion><div className="page-header"><div><span className="eyebrow-label">{t('nav.nutrition')}</span><h1>{t('nutrition.foodLog')}</h1><p>{t('nutrition.foodLogSubtitle')}</p></div><div className="food-log-header-actions"><Field label={t('nutrition.date')} type="date" value={date} onChange={(event) => setDate(event.target.value)} /><NeonButton size="sm" onClick={() => setEditor(emptyLog(user.id, date, householdId))}><Plus size={14} />{t('nutrition.addMeal')}</NeonButton></div></div><NutritionSubnav />{error && <div className="inline-error" role="alert">{error}</div>}<section className="food-log"><div className="food-log-summary"><GlassCard className="food-log-total"><span className="eyebrow-label">{t('nutrition.dailyTotal')}</span><strong>{formatNumber(dailyNutrition.calories, 0)} <small>/ {plan?.calories ?? '—'} kcal</small></strong><div className="progress-track"><span style={{ width: `${plan ? Math.min(100, dailyNutrition.calories / plan.calories * 100) : 0}%` }} /></div></GlassCard><NutritionSummary label={t('nutrition.protein')} value={dailyNutrition.proteinG} target={plan?.protein} unit="g" /><NutritionSummary label={t('nutrition.carbs')} value={dailyNutrition.carbohydratesG} target={plan?.carbs} unit="g" /><NutritionSummary label={t('nutrition.fat')} value={dailyNutrition.fatG} target={plan?.fats} unit="g" /></div>{isLoading ? <LoadingState /> : logs.length ? <div className="food-log-list">{logs.map((log) => <FoodLogCard key={log.id} log={log} language={language} t={t} onDelete={() => { void deleteLog(log) }} />)}</div> : <GlassCard><EmptyState icon={<Utensils size={20} />} title={t('nutrition.emptyFoodLog')} description={t('nutrition.foodLogSubtitle')} action={<NeonButton size="sm" onClick={() => setEditor(emptyLog(user.id, date, householdId))}><Plus size={14} />{t('nutrition.addMeal')}</NeonButton>} /></GlassCard>}</section><Modal open={Boolean(editor)} onClose={() => { if (!saving) setEditor(null) }} title={t('nutrition.addMeal')} size="lg">{editor && <FoodLogEditor initial={editor} language={language} recipes={recipes} saving={saving} onCancel={() => setEditor(null)} onSave={saveLog} t={t} />}</Modal></PageMotion>
}

function NutritionSummary({ label, value, target, unit }: { label: string; value: number; target?: number; unit: string }) { return <GlassCard className="food-log-metric"><span>{label}</span><strong>{formatNumber(value, 1)}<small>{unit}{target !== undefined ? ` / ${formatNumber(target, 1)}${unit}` : ''}</small></strong></GlassCard> }

function FoodLogCard({ log, language, t, onDelete }: { log: FoodLog; language: 'en' | 'es'; t: (key: string) => string; onDelete: () => void }) {
  const nutrition = logNutrition(log)
  return <GlassCard className="food-log-card"><div className="food-log-card-head"><div><span className="eyebrow-label">{localizedMealType(log.mealType, t)}</span><h2>{new Intl.DateTimeFormat(language === 'es' ? 'es-AR' : 'en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(log.consumedAt))}</h2></div><IconButton type="button" label={t('nutrition.removeMeal')} onClick={onDelete}><Trash2 size={14} /></IconButton></div><div className="food-log-items">{log.items.map((item) => <div className="food-log-item" key={item.id}><span>{item.food ? localizedFoodName(item.food, language) : item.recipe ? localizedRecipeName(item.recipe, language) : t('nutrition.chooseFood')}</span><strong>{formatNumber(item.quantity, 1)} {item.recipe ? t('nutrition.servings').toLowerCase() : item.unit}</strong></div>)}</div>{nutrition && <div className="food-log-card-total"><strong>{formatNumber(nutrition.calories, 0)} kcal</strong><span>{formatNumber(nutrition.proteinG, 1)}g {t('nutrition.protein').toLowerCase()}</span><span>{formatNumber(nutrition.carbohydratesG, 1)}g {t('nutrition.carbs').toLowerCase()}</span><span>{formatNumber(nutrition.fatG, 1)}g {t('nutrition.fat').toLowerCase()}</span></div>}{log.notes && <p className="food-log-notes">{log.notes}</p>}</GlassCard>
}

function FoodLogEditor({ initial, language, recipes, saving, onCancel, onSave, t }: { initial: LogDraft; language: 'en' | 'es'; recipes: Recipe[]; saving: boolean; onCancel: () => void; onSave: (log: FoodLog) => Promise<void>; t: (key: string) => string }) {
  const [draft, setDraft] = useState(initial)
  const [activeItem, setActiveItem] = useState<number | null>(null)
  const [foodSearch, setFoodSearch] = useState('')
  const [foodResults, setFoodResults] = useState<Food[]>([])
  const [validation, setValidation] = useState('')

  useEffect(() => {
    let active = true
    if (activeItem === null || draft.items[activeItem]?.source !== 'food' || !foodSearch.trim()) { setFoodResults([]); return () => { active = false } }
    const timer = window.setTimeout(() => { void searchFoods(foodSearch, 20).then((results) => { if (active) setFoodResults(results) }).catch(() => { if (active) setFoodResults([]) }) }, 180)
    return () => { active = false; window.clearTimeout(timer) }
  }, [activeItem, draft.items, foodSearch])

  const update = <K extends keyof LogDraft>(key: K, value: LogDraft[K]) => setDraft((current) => ({ ...current, [key]: value }))
  const updateItem = (index: number, patch: Partial<LogDraftItem>) => setDraft((current) => ({ ...current, items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }))
  const addItem = () => setDraft((current) => ({ ...current, items: [...current.items, { id: crypto.randomUUID(), source: 'food', food: null, recipe: null, quantity: '100', unit: 'g', portion: null, notes: '' }] }))
  const removeItem = (index: number) => setDraft((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }))
  const chooseFood = (index: number, food: Food) => { updateItem(index, { source: 'food', food, recipe: null, unit: food.defaultUnit, portion: food.portions.find((portion) => portion.isDefault) ?? food.portions[0] ?? null }); setActiveItem(null); setFoodSearch('') }
  const chooseRecipe = (index: number, recipeId: string) => { const recipe = recipes.find((item) => item.id === recipeId) ?? null; updateItem(index, { source: 'recipe', recipe, food: null, unit: 'portion', portion: null, quantity: '1' }); setActiveItem(null) }
  const recipePreview = (recipe: Recipe, servings: number) => { const items = recipe.ingredients.flatMap((ingredient) => { const nutrients = ingredient.food?.nutrients.find((item) => item.basis === 'per_100g'); return nutrients ? [{ nutrients, quantity: ingredient.quantity, unit: ingredient.unit, portion: ingredient.portion }] : [] }); if (items.length !== recipe.ingredients.length || !items.length) return null; try { return scaleNutrition(calculateRecipeNutrition(items, recipe.servings), servings) } catch { return null } }
  const preview = useMemo(() => { const totals = draft.items.flatMap((item) => { const quantity = Number(item.quantity); if (!Number.isFinite(quantity) || quantity <= 0) return []; if (item.source === 'food' && item.food) { const nutrients = item.food.nutrients.find((value) => value.basis === 'per_100g'); if (!nutrients) return []; try { return [calculateMealNutrition([{ nutrients, quantity, unit: item.unit, portion: item.portion ?? undefined }])] } catch { return [] } } if (item.source === 'recipe' && item.recipe) { const nutrition = recipePreview(item.recipe, quantity); return nutrition ? [nutrition] : [] } return [] }); return totals.length === draft.items.length && totals.length > 0 ? calculateDailyNutrition(totals) : null }, [draft.items])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!draft.items.length || draft.items.some((item) => item.source === 'food' ? !item.food : !item.recipe)) { setValidation(t('nutrition.noIngredient')); return }
    const items: FoodLogItem[] = draft.items.flatMap((item): FoodLogItem[] => { const quantity = Number(item.quantity); if (!Number.isFinite(quantity) || quantity <= 0) return []; if (item.source === 'food' && item.food) { const normalized = normalizeQuantity(quantity, item.unit, item.portion ?? undefined); return [{ id: item.id, foodLogId: draft.id, foodId: item.food.id, recipeId: null, foodPortionId: item.portion?.id, quantity, unit: item.unit, normalizedGrams: normalized.grams, normalizedMilliliters: normalized.milliliters, precision: item.portion ? 'portion' : 'exact', notes: item.notes, food: item.food, portion: item.portion ?? undefined, createdAt: '', updatedAt: '' }] } if (item.source === 'recipe' && item.recipe) return [{ id: item.id, foodLogId: draft.id, foodId: null, recipeId: item.recipe.id, quantity, unit: 'portion', normalizedGrams: null, normalizedMilliliters: null, precision: 'portion', notes: item.notes, recipe: item.recipe, createdAt: '', updatedAt: '' }]; return [] })
    if (items.length !== draft.items.length) { setValidation(t('nutrition.quantity')); return }
    const consumedAt = new Date(draft.consumedAt)
    if (Number.isNaN(consumedAt.getTime())) { setValidation(t('nutrition.time')); return }
    void onSave({ id: draft.id, userId: draft.userId, householdId: draft.householdId, visibility: draft.visibility, consumedOn: draft.consumedOn, consumedAt: consumedAt.toISOString(), mealType: draft.mealType, notes: draft.notes, items, createdAt: '', updatedAt: '' })
  }

  return <form className="food-log-editor" onSubmit={submit}><div className="settings-grid"><Field label={t('nutrition.date')} type="date" value={draft.consumedOn} onChange={(event) => update('consumedOn', event.target.value)} required /><Field label={t('nutrition.time')} type="datetime-local" value={draft.consumedAt} onChange={(event) => update('consumedAt', event.target.value)} required /><SelectField label={t('nutrition.mealType')} value={draft.mealType} onChange={(event) => update('mealType', event.target.value as MealType)}>{(['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout', 'other'] as MealType[]).map((type) => <option key={type} value={type}>{localizedMealType(type, t)}</option>)}</SelectField><SelectField label={t('nutrition.visibility')} value={draft.visibility} onChange={(event) => update('visibility', event.target.value as LogDraft['visibility'])}><option value="private">{t('nutrition.private')}</option><option value="household">{t('nutrition.household')}</option></SelectField></div><div className="food-log-editor-section"><SectionHeading eyebrow={t('nutrition.mealItems')} title={t('nutrition.mealItems')} action={<NeonButton type="button" size="sm" variant="secondary" onClick={addItem}><Plus size={13} />{t('nutrition.addIngredient')}</NeonButton>} />{draft.items.length ? <div className="food-log-editor-items">{draft.items.map((item, index) => { const units = item.food ? [...new Set<FoodUnit>([item.food.defaultUnit, ...item.food.portions.map((portion) => portion.unit)])] : ['g' as FoodUnit]; return <div className="food-log-editor-row" key={item.id}><SelectField label={t('nutrition.source')} value={item.source} onChange={(event) => { const source = event.target.value as LogDraftItem['source']; updateItem(index, { source, food: source === 'food' ? item.food : null, recipe: source === 'recipe' ? item.recipe : null, unit: source === 'recipe' ? 'portion' : item.food?.defaultUnit ?? 'g', quantity: source === 'recipe' ? '1' : item.quantity }) }}><option value="food">{t('nutrition.chooseFood')}</option><option value="recipe">{t('nutrition.recipes')}</option></SelectField><div className="food-log-editor-food">{item.source === 'food' ? item.food ? <button type="button" className="recipe-food-selected" onClick={() => { setActiveItem(index); setFoodSearch('') }}>{localizedFoodName(item.food, language)}</button> : <Field label={t('nutrition.chooseFood')} value={activeItem === index ? foodSearch : ''} onFocus={() => setActiveItem(index)} onChange={(event) => { setActiveItem(index); setFoodSearch(event.target.value) }} placeholder={t('nutrition.searchFood')} /> : <SelectField label={t('nutrition.chooseRecipe')} value={item.recipe?.id ?? ''} onChange={(event) => chooseRecipe(index, event.target.value)}><option value="">{t('nutrition.chooseRecipe')}</option>{recipes.map((recipe) => <option key={recipe.id} value={recipe.id}>{localizedRecipeName(recipe, language)}</option>)}</SelectField>}{activeItem === index && item.source === 'food' && foodResults.length > 0 && <div className="recipe-food-results">{foodResults.map((food) => <button type="button" key={food.id} onClick={() => chooseFood(index, food)}><strong>{localizedFoodName(food, language)}</strong><small>{localizedFoodCategory(food, language)} · {food.nutrients.find((nutrient) => nutrient.basis === 'per_100g')?.calories ?? '—'} kcal / 100 g</small></button>)}</div>}</div><Field label={item.source === 'recipe' ? t('nutrition.servings') : t('nutrition.quantity')} type="number" min="0" step="0.1" value={item.quantity} onChange={(event) => updateItem(index, { quantity: event.target.value })} /><SelectField label={t('nutrition.unit')} value={item.unit} onChange={(event) => updateItem(index, { unit: event.target.value as FoodUnit })} disabled={item.source === 'recipe'}>{(item.source === 'recipe' ? ['portion' as FoodUnit] : units).map((unit) => <option key={unit} value={unit}>{unit}</option>)}</SelectField><IconButton type="button" label={t('nutrition.removeIngredient')} onClick={() => removeItem(index)}><Trash2 size={14} /></IconButton></div> })}</div> : <p className="food-log-editor-empty">{t('nutrition.noIngredient')}</p>}</div>{preview && <div className="food-log-preview"><strong>{formatNumber(preview.calories, 0)} kcal</strong><span>{formatNumber(preview.proteinG, 1)}g {t('nutrition.protein').toLowerCase()}</span><span>{formatNumber(preview.carbohydratesG, 1)}g {t('nutrition.carbs').toLowerCase()}</span><span>{formatNumber(preview.fatG, 1)}g {t('nutrition.fat').toLowerCase()}</span></div>}<TextAreaField label={t('strategy.notes')} value={draft.notes} onChange={(event) => update('notes', event.target.value)} />{validation && <div className="inline-error" role="alert">{validation}</div>}<div className="modal-actions"><NeonButton type="button" variant="ghost" onClick={onCancel} disabled={saving}>{t('common.cancel')}</NeonButton><NeonButton type="submit" loading={saving}>{t('nutrition.saveMeal')}</NeonButton></div></form>
}

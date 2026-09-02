import { ChefHat, Clock3, Copy, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { PageMotion } from '../components/PageMotion'
import { NutritionSubnav } from '../components/NutritionSubnav'
import { GlassCard, EmptyState, Field, IconButton, LoadingState, Modal, NeonButton, SectionHeading, SelectField, TextAreaField } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { calculateRecipeNutrition, normalizeQuantity } from '../lib/nutrition'
import { localizedFoodCategory, localizedFoodName } from '../lib/food'
import { deleteRecipe, loadRecipes, loadUserCoupleId, saveRecipe, searchFoods } from '../lib/repository'
import { formatNumber, uid } from '../lib/utils'
import type { Food, FoodPortion, FoodUnit, Recipe, RecipeIngredient, RecipeVisibility } from '../types'

interface RecipeDraftIngredient {
  id: string
  food: Food | null
  quantity: string
  unit: FoodUnit
  portion: FoodPortion | null
  notes: string
}

interface RecipeDraft {
  id: string
  createdBy: string
  coupleId: string | null
  name: string
  nameEs: string
  description: string
  instructions: string
  prepTimeMinutes: number
  cookTimeMinutes: number
  servings: number
  imageUrl: string
  visibility: RecipeVisibility
  ingredients: RecipeDraftIngredient[]
  createdAt: string
  updatedAt: string
}

function emptyRecipe(userId: string, coupleId: string | null): RecipeDraft {
  return { id: uid('recipe'), createdBy: userId, coupleId, name: '', nameEs: '', description: '', instructions: '', prepTimeMinutes: 0, cookTimeMinutes: 0, servings: 1, imageUrl: '', visibility: 'private', ingredients: [], createdAt: '', updatedAt: '' }
}

function draftFromRecipe(recipe: Recipe): RecipeDraft {
  return { ...recipe, createdBy: recipe.createdBy ?? '', ingredients: recipe.ingredients.map((ingredient) => ({ id: ingredient.id, food: ingredient.food ?? null, quantity: String(ingredient.quantity), unit: ingredient.unit, portion: ingredient.portion ?? null, notes: ingredient.notes })) }
}

function recipeNutrition(recipe: Recipe) {
  const items = recipe.ingredients.flatMap((ingredient) => {
    const nutrients = ingredient.food?.nutrients.find((item) => item.basis === 'per_100g')
    return nutrients ? [{ nutrients, quantity: ingredient.quantity, unit: ingredient.unit, portion: ingredient.portion }] : []
  })
  if (items.length !== recipe.ingredients.length || !items.length) return null
  try { return calculateRecipeNutrition(items, recipe.servings) } catch { return null }
}

export function RecipesPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const language = i18n.language.startsWith('es') ? 'es' : 'en'
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [editor, setEditor] = useState<RecipeDraft | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError('')
    try {
      const [nextRecipes, nextCoupleId] = await Promise.all([loadRecipes(), loadUserCoupleId(user.id)])
      setRecipes(nextRecipes)
      setCoupleId(nextCoupleId)
    } catch { setError(t('nutrition.recipeError')) } finally { setIsLoading(false) }
  }, [t, user])

  useEffect(() => { void refresh() }, [refresh])

  const save = async (draft: Recipe) => {
    setSaving(true)
    setError('')
    try { await saveRecipe(draft); setEditor(null); await refresh() } catch { setError(t('nutrition.recipeError')) } finally { setSaving(false) }
  }

  const remove = async (recipe: Recipe) => {
    if (!window.confirm(t('nutrition.deleteConfirm'))) return
    try { await deleteRecipe(recipe.id); await refresh() } catch { setError(t('nutrition.recipeError')) }
  }

  if (!user) return null
  return <PageMotion><div className="page-header"><div><span className="eyebrow-label">{t('nav.nutrition')}</span><h1>{t('nutrition.recipes')}</h1><p>{t('nutrition.recipesSubtitle')}</p></div><NeonButton size="sm" onClick={() => setEditor(emptyRecipe(user.id, coupleId))}><Plus size={14} />{t('nutrition.createRecipe')}</NeonButton></div><NutritionSubnav />{error && <div className="inline-error" role="alert">{error}</div>}{isLoading ? <LoadingState /> : recipes.length ? <section className="recipe-library"><SectionHeading eyebrow={t('nutrition.recipes')} title={`${recipes.length} ${t('nutrition.recipeCount')}`} /><div className="recipe-grid">{recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} language={language} onEdit={() => setEditor(draftFromRecipe(recipe))} onDelete={() => { void remove(recipe) }} t={t} />)}</div></section> : <GlassCard><EmptyState icon={<ChefHat size={20} />} title={t('nutrition.emptyRecipes')} description={t('nutrition.recipesSubtitle')} action={<NeonButton size="sm" onClick={() => setEditor(emptyRecipe(user.id, coupleId))}><Plus size={14} />{t('nutrition.createRecipe')}</NeonButton>} /></GlassCard>}<Modal open={Boolean(editor)} onClose={() => { if (!saving) setEditor(null) }} title={editor?.name ? t('nutrition.editRecipe') : t('nutrition.createRecipe')} size="lg">{editor && <RecipeEditor initial={editor} coupleId={coupleId} language={language} saving={saving} onCancel={() => setEditor(null)} onSave={save} t={t} />}</Modal></PageMotion>
}

function RecipeCard({ recipe, language, onEdit, onDelete, t }: { recipe: Recipe; language: 'en' | 'es'; onEdit: () => void; onDelete: () => void; t: (key: string) => string }) {
  const nutrition = recipeNutrition(recipe)
  return <GlassCard className="recipe-card" hover><div className="recipe-card-head"><span className="recipe-card-icon"><ChefHat size={18} /></span><div className="recipe-card-actions"><IconButton type="button" label={t('common.edit')} onClick={onEdit}><Copy size={14} /></IconButton><IconButton type="button" label={t('common.delete')} onClick={onDelete}><Trash2 size={14} /></IconButton></div></div><span className="eyebrow-label">{recipe.visibility === 'household' ? t('nutrition.household') : t('nutrition.private')}</span><h2>{language === 'es' ? recipe.nameEs || recipe.name : recipe.name}</h2><p>{recipe.description || t('nutrition.ingredients')}</p><div className="recipe-card-meta"><span><ChefHat size={12} />{recipe.ingredients.length} {t('nutrition.ingredients').toLowerCase()}</span><span><Clock3 size={12} />{recipe.prepTimeMinutes + recipe.cookTimeMinutes} {t('nutrition.minutes')}</span><span>{recipe.servings} {t('nutrition.servings').toLowerCase()}</span></div>{nutrition && <div className="recipe-card-nutrition"><strong>{formatNumber(nutrition.calories, 0)} kcal</strong><span>{formatNumber(nutrition.proteinG, 1)}g {t('nutrition.protein').toLowerCase()}</span><span>{formatNumber(nutrition.carbohydratesG, 1)}g {t('nutrition.carbs').toLowerCase()}</span></div>}</GlassCard>
}

function RecipeEditor({ initial, coupleId, language, saving, onCancel, onSave, t }: { initial: RecipeDraft; coupleId: string | null; language: 'en' | 'es'; saving: boolean; onCancel: () => void; onSave: (recipe: Recipe) => Promise<void>; t: (key: string) => string }) {
  const [draft, setDraft] = useState(initial)
  const [activeIngredient, setActiveIngredient] = useState<number | null>(null)
  const [foodSearch, setFoodSearch] = useState('')
  const [foodResults, setFoodResults] = useState<Food[]>([])
  const [validation, setValidation] = useState('')

  useEffect(() => {
    let active = true
    if (!foodSearch.trim()) { setFoodResults([]); return () => { active = false } }
    const timer = window.setTimeout(() => { void searchFoods(foodSearch, 20).then((results) => { if (active) setFoodResults(results) }).catch(() => { if (active) setFoodResults([]) }) }, 180)
    return () => { active = false; window.clearTimeout(timer) }
  }, [foodSearch])

  const update = <K extends keyof RecipeDraft>(key: K, value: RecipeDraft[K]) => setDraft((current) => ({ ...current, [key]: value }))
  const updateIngredient = (index: number, patch: Partial<RecipeDraftIngredient>) => setDraft((current) => ({ ...current, ingredients: current.ingredients.map((ingredient, itemIndex) => itemIndex === index ? { ...ingredient, ...patch } : ingredient) }))
  const addIngredient = () => setDraft((current) => ({ ...current, ingredients: [...current.ingredients, { id: uid('ingredient'), food: null, quantity: '100', unit: 'g', portion: null, notes: '' }] }))
  const removeIngredient = (index: number) => setDraft((current) => ({ ...current, ingredients: current.ingredients.filter((_, itemIndex) => itemIndex !== index) }))
  const chooseFood = (index: number, food: Food) => { updateIngredient(index, { food, unit: food.defaultUnit, portion: food.portions.find((portion) => portion.isDefault) ?? food.portions[0] ?? null }); setActiveIngredient(null); setFoodSearch('') }

  const preview = useMemo(() => {
    const items = draft.ingredients.flatMap((ingredient) => { const nutrients = ingredient.food?.nutrients.find((item) => item.basis === 'per_100g'); const quantity = Number(ingredient.quantity); return nutrients && quantity > 0 ? [{ nutrients, quantity, unit: ingredient.unit, portion: ingredient.portion ?? undefined }] : [] })
    if (items.length !== draft.ingredients.length || !items.length) return null
    try { return calculateRecipeNutrition(items, draft.servings) } catch { return null }
  }, [draft])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!draft.name.trim()) { setValidation(t('nutrition.recipeName')); return }
    if (!draft.ingredients.length || draft.ingredients.some((ingredient) => !ingredient.food)) { setValidation(t('nutrition.noIngredient')); return }
    if (!draft.servings || draft.servings <= 0) { setValidation(t('nutrition.servings')); return }
    const ingredients: RecipeIngredient[] = draft.ingredients.flatMap((ingredient, index) => {
      if (!ingredient.food) return []
      const quantity = Number(ingredient.quantity)
      const normalized = normalizeQuantity(quantity, ingredient.unit, ingredient.portion ?? undefined)
      return [{ id: ingredient.id, recipeId: draft.id, foodId: ingredient.food.id, foodPortionId: ingredient.portion?.id, quantity, unit: ingredient.unit, normalizedGrams: normalized.grams, normalizedMilliliters: normalized.milliliters, notes: ingredient.notes, orderIndex: index, food: ingredient.food, portion: ingredient.portion ?? undefined, createdAt: '', updatedAt: '' }]
    })
    void onSave({ id: draft.id, createdBy: draft.createdBy, coupleId: draft.visibility === 'household' ? coupleId : null, name: draft.name.trim(), nameEs: draft.nameEs.trim() || draft.name.trim(), description: draft.description, instructions: draft.instructions, prepTimeMinutes: Math.max(0, draft.prepTimeMinutes), cookTimeMinutes: Math.max(0, draft.cookTimeMinutes), servings: draft.servings, imageUrl: draft.imageUrl, visibility: draft.visibility, ingredients, createdAt: draft.createdAt, updatedAt: draft.updatedAt })
  }

  return <form className="recipe-editor" onSubmit={submit}><div className="settings-grid"><Field label={t('nutrition.recipeName')} value={draft.name} onChange={(event) => update('name', event.target.value)} required /><Field label={t('nutrition.recipeNameEs')} value={draft.nameEs} onChange={(event) => update('nameEs', event.target.value)} /></div><TextAreaField label={t('nutrition.description')} value={draft.description} onChange={(event) => update('description', event.target.value)} /><TextAreaField label={t('nutrition.instructions')} value={draft.instructions} onChange={(event) => update('instructions', event.target.value)} /><div className="settings-grid"><Field label={t('nutrition.prepTime')} type="number" min="0" value={draft.prepTimeMinutes} onChange={(event) => update('prepTimeMinutes', Number(event.target.value) || 0)} /><Field label={t('nutrition.cookTime')} type="number" min="0" value={draft.cookTimeMinutes} onChange={(event) => update('cookTimeMinutes', Number(event.target.value) || 0)} /><Field label={t('nutrition.servings')} type="number" min="1" step="0.5" value={draft.servings} onChange={(event) => update('servings', Number(event.target.value) || 0)} /><SelectField label={t('nutrition.visibility')} value={draft.visibility} onChange={(event) => update('visibility', event.target.value as RecipeVisibility)}><option value="private">{t('nutrition.private')}</option>{coupleId && <option value="household">{t('nutrition.household')}</option>}</SelectField></div><div className="recipe-editor-section"><SectionHeading eyebrow={t('nutrition.ingredients')} title={t('nutrition.ingredients')} action={<NeonButton type="button" size="sm" variant="secondary" onClick={addIngredient}><Plus size={13} />{t('nutrition.addIngredient')}</NeonButton>} />{draft.ingredients.length ? <div className="recipe-ingredient-list">{draft.ingredients.map((ingredient, index) => { const units = ingredient.food ? [...new Set<FoodUnit>([ingredient.food.defaultUnit, ...ingredient.food.portions.map((portion) => portion.unit)])] : ['g' as FoodUnit]; return <div className="recipe-ingredient-row" key={ingredient.id}><span className="recipe-ingredient-number">{String(index + 1).padStart(2, '0')}</span><div className="recipe-ingredient-food">{ingredient.food ? <button type="button" className="recipe-food-selected" onClick={() => { setActiveIngredient(index); setFoodSearch('') }}>{localizedFoodName(ingredient.food, language)}</button> : <Field label={t('nutrition.chooseFood')} value={activeIngredient === index ? foodSearch : ''} onFocus={() => setActiveIngredient(index)} onChange={(event) => { setActiveIngredient(index); setFoodSearch(event.target.value) }} placeholder={t('nutrition.searchFood')} />}{activeIngredient === index && foodResults.length > 0 && <div className="recipe-food-results">{foodResults.map((food) => <button type="button" key={food.id} onClick={() => chooseFood(index, food)}><strong>{localizedFoodName(food, language)}</strong><small>{localizedFoodCategory(food, language)} · {food.nutrients.find((item) => item.basis === 'per_100g')?.calories ?? '—'} kcal / 100 g</small></button>)}</div>}</div><Field aria-label={t('nutrition.quantity')} type="number" min="0" step="0.1" value={ingredient.quantity} onChange={(event) => updateIngredient(index, { quantity: event.target.value })} /><SelectField aria-label={t('nutrition.unit')} value={ingredient.unit} onChange={(event) => updateIngredient(index, { unit: event.target.value as FoodUnit })}>{units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</SelectField><IconButton type="button" label={t('nutrition.removeIngredient')} onClick={() => removeIngredient(index)}><Trash2 size={14} /></IconButton></div>})}</div> : <EmptyState icon={<ChefHat size={18} />} title={t('nutrition.noIngredient')} />}</div>{preview && <div className="recipe-preview"><SectionHeading eyebrow={t('nutrition.calculate')} title={`${formatNumber(preview.calories, 0)} kcal / ${t('nutrition.servings').toLowerCase()}`} /><div><span>{formatNumber(preview.proteinG, 1)}g {t('nutrition.protein').toLowerCase()}</span><span>{formatNumber(preview.carbohydratesG, 1)}g {t('nutrition.carbs').toLowerCase()}</span><span>{formatNumber(preview.fatG, 1)}g {t('nutrition.fat').toLowerCase()}</span></div></div>}{validation && <div className="inline-error" role="alert">{validation}</div>}<div className="modal-actions"><NeonButton type="button" variant="ghost" onClick={onCancel} disabled={saving}>{t('common.cancel')}</NeonButton><NeonButton type="submit" loading={saving}>{t('nutrition.saveRecipe')}</NeonButton></div></form>
}

import { Archive, Copy, Database, Heart, Pencil, Plus, Search } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { PageMotion } from '../components/PageMotion'
import { NutritionSubnav } from '../components/NutritionSubnav'
import { GlassCard, Field, IconButton, LoadingState, Modal, NeonButton, SearchField, SectionHeading, SelectField, StatusPill, TextAreaField } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useFoodLibrary, type FoodLibraryScope } from '../hooks/useFoodLibrary'
import { archiveCustomFood, createCustomFood, updateCustomFood } from '../lib/repository'
import { calculateNutrition } from '../lib/nutrition'
import { localizedFoodCategory, localizedFoodName, localizedFoodSubcategory } from '../lib/food'
import { formatNumber } from '../lib/utils'
import type { CreateCustomFoodInput, Food, FoodUnit } from '../types'

export function FoodLibraryPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const language = i18n.language.startsWith('es') ? 'es' : 'en'
  const [scope, setScope] = useState<FoodLibraryScope>('all')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const { foods, totalCount, favoriteIds, search, setSearch, isLoading, isLoadingMore, hasMore, error, toggleFavorite, loadMore, refresh } = useFoodLibrary(user?.id, scope)
  const [category, setCategory] = useState('all')
  const [selected, setSelected] = useState<Food | null>(null)
  const [editor, setEditor] = useState<CreateCustomFoodInput | null>(null)
  const [editorFoodId, setEditorFoodId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const categories = useMemo(() => [...new Set(foods.map((food) => food.category).filter(Boolean))].sort((left, right) => left.localeCompare(right)), [foods])
  const filteredFoods = useMemo(() => foods.filter((food) => (category === 'all' || food.category === category) && (!favoritesOnly || favoriteIds.has(food.id))), [category, favoritesOnly, favoriteIds, foods])
  const save = async (input: CreateCustomFoodInput) => {
    setSaving(true)
    setSaveError('')
    try { if (editorFoodId) await updateCustomFood(editorFoodId, input); else await createCustomFood(input); setEditor(null); setEditorFoodId(null); await refresh() } catch { setSaveError(t('customFood.error')) } finally { setSaving(false) }
  }
  const archive = async (food: Food) => {
    if (!window.confirm(t('customFood.archiveConfirm'))) return
    try { await archiveCustomFood(food.id); await refresh() } catch { setSaveError(t('customFood.error')) }
  }

  if (!user) return null
  return <PageMotion>
    <div className="page-header">
      <div><span className="eyebrow-label">{t('nav.nutrition')}</span><h1>{t('nutrition.foods')}</h1><p>{t('nutrition.foodsSubtitle')}</p></div>
      <div className="food-library-header-actions"><StatusPill tone="violet"><Database size={13} />{totalCount || foods.length} {t('nutrition.results')}</StatusPill><NeonButton size="sm" onClick={() => { setEditorFoodId(null); setEditor({ name: '', brand: '', category: '', servingSize: 100, servingUnit: 'g', calories: 0, protein: null, carbs: null, fat: null, fiber: null, sugar: null, sodiumMg: null, saturatedFat: null, notes: '' }) }}><Plus size={14} />{t('customFood.create')}</NeonButton></div>
    </div>
    <NutritionSubnav />
    <section className="food-library">
      <SectionHeading eyebrow={t('nutrition.imported')} title={t('nutrition.title')} description={t('nutrition.subtitle')} />
      <div className="food-library-toolbar">
        <SearchField value={search} onChange={setSearch} placeholder={t('nutrition.searchPlaceholder')} />
        <div className="food-library-filters" role="group" aria-label={t('customFood.title')}>
          {([['all', 'customFood.all'], ['global', 'customFood.global'], ['mine', 'customFood.mine']] as const).map(([value, label]) => <button type="button" className={scope === value && !favoritesOnly ? 'active' : ''} onClick={() => { setFavoritesOnly(false); setScope(value) }} key={value}>{t(label)}</button>)}
          <button type="button" className={favoritesOnly ? 'active' : ''} onClick={() => setFavoritesOnly((current) => !current)}>{t('customFood.favorites')}</button>
        </div>
        <SelectField className="food-category-select" aria-label={t('nutrition.category')} value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">{t('common.all')}</option>
          {categories.map((item) => { const food = foods.find((candidate) => candidate.category === item); return <option key={item} value={item}>{food ? localizedFoodCategory(food, language) : item}</option> })}
        </SelectField>
      </div>
      {error && <div className="inline-error" role="alert">{error}</div>}
      {isLoading ? <LoadingState /> : filteredFoods.length ? <div className="food-results">
        {(['user', 'system'] as const).map((sourceType) => {
          const group = filteredFoods.filter((food) => food.sourceType === sourceType)
          if (!group.length) return null
          return <section className="food-library-group" key={sourceType}><SectionHeading eyebrow={sourceType === 'user' ? t('customFood.myFood') : t('customFood.globalFood')} title={sourceType === 'user' ? t('customFood.mine') : t('customFood.global')} /><div className="food-grid">{group.map((food) => <FoodCard key={food.id} food={food} language={language} favorite={favoriteIds.has(food.id)} onOpen={() => setSelected(food)} onToggleFavorite={() => { void toggleFavorite(food.id) }} onEdit={sourceType === 'user' ? () => { setEditorFoodId(food.id); setEditor(customFoodInput(food)) } : undefined} onArchive={sourceType === 'user' ? () => { void archive(food) } : undefined} onDuplicate={sourceType === 'user' ? () => { setEditorFoodId(null); setEditor({ ...customFoodInput(food), name: `${food.name} copy` }) } : undefined} t={t} />)}</div></section>
        })}
        {hasMore && <div className="food-load-more"><NeonButton variant="secondary" size="sm" onClick={() => { void loadMore() }} loading={isLoadingMore}>{t('nutrition.loadMore')}</NeonButton></div>}
      </div> : <GlassCard><div className="empty-state"><span className="empty-icon"><Search size={18} /></span><h3>{t('nutrition.noFoods')}</h3><p>{t('nutrition.foodsSubtitle')}</p></div></GlassCard>}
    </section>
    <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={t('nutrition.details')} size="lg">{selected && <FoodDetail food={selected} language={language} t={t} />}</Modal>
    <Modal open={Boolean(editor)} onClose={() => { if (!saving) { setEditor(null); setEditorFoodId(null) } }} title={editorFoodId ? t('customFood.edit') : t('customFood.create')} size="lg">{editor && <CustomFoodEditor initial={editor} saving={saving} error={saveError} onCancel={() => { setEditor(null); setEditorFoodId(null) }} onSave={save} t={t} />}</Modal>
  </PageMotion>
}

function customFoodInput(food: Food): CreateCustomFoodInput {
  const nutrition = food.nutrients[0]
  const portion = food.portions.find((item) => item.isDefault) ?? food.portions[0]
  const servingUnit = portion?.unit ?? food.defaultUnit
  const servingSize = portion?.grams ?? portion?.milliliters ?? 1
  const factor = nutrition?.basis === 'per_100g' ? servingSize / 100 : nutrition?.basis === 'per_100ml' ? servingSize / 100 : 1
  return { name: food.name, brand: food.brand, category: food.category, servingSize, servingUnit, calories: (nutrition?.calories ?? 0) * factor, protein: nutrition?.proteinG === null ? null : (nutrition?.proteinG ?? 0) * factor, carbs: nutrition?.carbohydratesG === null ? null : (nutrition?.carbohydratesG ?? 0) * factor, fat: nutrition?.fatG === null ? null : (nutrition?.fatG ?? 0) * factor, fiber: nutrition?.fiberG === null ? null : (nutrition?.fiberG ?? 0) * factor, sugar: nutrition?.sugarG === null ? null : (nutrition?.sugarG ?? 0) * factor, sodiumMg: nutrition?.sodiumMg === null ? null : (nutrition?.sodiumMg ?? 0) * factor, saturatedFat: nutrition?.saturatedFatG === null ? null : (nutrition?.saturatedFatG ?? 0) * factor, notes: food.description }
}

function nutrientValue(value: number | null, unit: string) { return value === null ? '—' : `${formatNumber(value, value % 1 ? 1 : 0)}${unit}` }

function FoodCard({ food, language, favorite, onOpen, onToggleFavorite, onEdit, onArchive, onDuplicate, t }: { food: Food; language: 'en' | 'es'; favorite: boolean; onOpen: () => void; onToggleFavorite: () => void; onEdit?: () => void; onArchive?: () => void; onDuplicate?: () => void; t: (key: string) => string }) {
  const nutrients = food.nutrients.find((item) => item.basis === 'per_100g') ?? food.nutrients[0]
  return <GlassCard className="food-card" hover onClick={onOpen}>
    <div className="food-card-head">
      <div><span className="eyebrow-label">{food.sourceType === 'user' ? t('customFood.myFood') : localizedFoodCategory(food, language) || t('nutrition.uncategorized')}</span><h3>{localizedFoodName(food, language)}</h3></div>
      <div className="food-card-actions">{onEdit && <IconButton type="button" label={t('customFood.edit')} onClick={(event) => { event.stopPropagation(); onEdit() }}><Pencil size={14} /></IconButton>}{onDuplicate && <IconButton type="button" label={t('customFood.duplicate')} onClick={(event) => { event.stopPropagation(); onDuplicate() }}><Copy size={14} /></IconButton>}{onArchive && <IconButton type="button" label={t('customFood.archive')} onClick={(event) => { event.stopPropagation(); onArchive() }}><Archive size={14} /></IconButton>}<IconButton type="button" label={t('nutrition.favorite')} onClick={(event) => { event.stopPropagation(); onToggleFavorite() }}><Heart size={15} fill={favorite ? 'currentColor' : 'none'} /></IconButton></div>
    </div>
    <p className="food-card-description">{localizedFoodSubcategory(food, language) || food.description || t('nutrition.per100g')}</p>
    <div className="food-card-nutrition">
      <span><strong>{nutrientValue(nutrients?.calories ?? null, '')}</strong><small>{t('nutrition.calories')}</small></span>
      <span><strong>{nutrientValue(nutrients?.proteinG ?? null, 'g')}</strong><small>{t('nutrition.protein')}</small></span>
      <span><strong>{nutrientValue(nutrients?.carbohydratesG ?? null, 'g')}</strong><small>{t('nutrition.carbs')}</small></span>
      <span><strong>{nutrientValue(nutrients?.fatG ?? null, 'g')}</strong><small>{t('nutrition.fat')}</small></span>
    </div>
  </GlassCard>
}

function FoodDetail({ food, language, t }: { food: Food; language: 'en' | 'es'; t: (key: string) => string }) {
  const nutrients = food.nutrients.find((item) => item.basis === 'per_100g')
  const units = [...new Set<FoodUnit>([food.defaultUnit, ...food.portions.map((portion) => portion.unit)])]
  const [quantity, setQuantity] = useState('100')
  const [unit, setUnit] = useState<FoodUnit>(food.defaultUnit)
  const portion = food.portions.find((item) => item.unit === unit && item.isDefault) ?? food.portions.find((item) => item.unit === unit)
  const calculated = nutrients && quantity !== '' ? (() => { try { return calculateNutrition(nutrients, Number(quantity), unit, portion) } catch { return null } })() : null

  return <div className="food-detail">
    <div className="food-detail-head"><div><span className="eyebrow-label">{localizedFoodCategory(food, language) || t('nutrition.uncategorized')}</span><h3>{localizedFoodName(food, language)}</h3>{food.description && food.description !== food.name && <p>{food.description}</p>}</div><StatusPill tone="muted">{t('nutrition.per100g')}</StatusPill></div>
    <div className="food-detail-nutrition">
      <NutritionValue label={t('nutrition.calories')} value={nutrients?.calories ?? null} unit="kcal" />
      <NutritionValue label={t('nutrition.protein')} value={nutrients?.proteinG ?? null} unit="g" />
      <NutritionValue label={t('nutrition.carbs')} value={nutrients?.carbohydratesG ?? null} unit="g" />
      <NutritionValue label={t('nutrition.fat')} value={nutrients?.fatG ?? null} unit="g" />
      <NutritionValue label={t('nutrition.fiber')} value={nutrients?.fiberG ?? null} unit="g" />
    </div>
    <div className="food-calculator"><SectionHeading eyebrow={t('nutrition.calculate')} title={t('nutrition.quantity')} /><div className="food-calculator-fields"><Field label={t('nutrition.quantity')} type="number" min="0" step="0.1" value={quantity} onChange={(event) => setQuantity(event.target.value)} /><SelectField label={t('nutrition.unit')} value={unit} onChange={(event) => setUnit(event.target.value as FoodUnit)}>{units.map((item) => <option key={item} value={item}>{item}</option>)}</SelectField></div>{calculated && <div className="food-calculated-result"><span>{formatNumber(calculated.calories, 0)} kcal</span><span>{formatNumber(calculated.proteinG, 1)}g {t('nutrition.protein').toLowerCase()}</span><span>{formatNumber(calculated.carbohydratesG, 1)}g {t('nutrition.carbs').toLowerCase()}</span><span>{formatNumber(calculated.fatG, 1)}g {t('nutrition.fat').toLowerCase()}</span></div>}</div>
    {food.portions.length > 0 && <div className="food-portions"><SectionHeading title={t('nutrition.portions')} /><div className="food-portions-list">{food.portions.map((item) => <span key={item.id}>{item.label}{item.grams ? ` · ${formatNumber(item.grams, 1)} g` : ''}</span>)}</div></div>}
    {food.source && <p className="food-source">{t('nutrition.source')}: <a href={food.source.sourceUrl} target="_blank" rel="noreferrer">{food.source.name}</a><br />{food.source.attribution}</p>}
  </div>
}

function NutritionValue({ label, value, unit }: { label: string; value: number | null; unit: string }) { return <div><span>{label}</span><strong>{nutrientValue(value, unit)}</strong></div> }

function CustomFoodEditor({ initial, saving, error, onCancel, onSave, t }: { initial: CreateCustomFoodInput; saving: boolean; error: string; onCancel: () => void; onSave: (input: CreateCustomFoodInput) => Promise<void>; t: (key: string) => string }) {
  const [form, setForm] = useState(initial)
  const [validation, setValidation] = useState('')
  const update = <K extends keyof CreateCustomFoodInput>(key: K, value: CreateCustomFoodInput[K]) => setForm((current) => ({ ...current, [key]: value }))
  const numberValue = (value: string) => value === '' ? null : Number(value)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!form.name.trim() || !Number.isFinite(form.servingSize) || form.servingSize <= 0 || !Number.isFinite(form.calories) || form.calories < 0) { setValidation(t('errors.required')); return }
    setValidation('')
    void onSave({ ...form, name: form.name.trim() })
  }
  return <form className="custom-food-editor" onSubmit={submit}><div className="settings-grid"><Field label={t('customFood.name')} value={form.name} onChange={(event) => update('name', event.target.value)} required autoFocus /><Field label={t('customFood.brand')} value={form.brand ?? ''} onChange={(event) => update('brand', event.target.value)} /><Field label={t('customFood.category')} value={form.category ?? ''} onChange={(event) => update('category', event.target.value)} /><Field label={t('customFood.servingSize')} type="number" min="0.01" step="0.01" value={form.servingSize} onChange={(event) => update('servingSize', Number(event.target.value))} required /><SelectField label={t('customFood.servingUnit')} value={form.servingUnit} onChange={(event) => update('servingUnit', event.target.value as FoodUnit)}>{(['g', 'kg', 'mg', 'ml', 'l', 'unit', 'cup', 'tablespoon', 'teaspoon', 'slice', 'portion', 'piece'] as FoodUnit[]).map((unit) => <option key={unit} value={unit}>{unit}</option>)}</SelectField><Field label={t('customFood.calories')} type="number" min="0" step="0.01" value={form.calories} onChange={(event) => update('calories', Number(event.target.value))} required /></div><div className="settings-grid"><Field label={t('customFood.protein')} type="number" min="0" step="0.01" value={form.protein ?? ''} onChange={(event) => update('protein', numberValue(event.target.value))} /><Field label={t('customFood.carbs')} type="number" min="0" step="0.01" value={form.carbs ?? ''} onChange={(event) => update('carbs', numberValue(event.target.value))} /><Field label={t('customFood.fat')} type="number" min="0" step="0.01" value={form.fat ?? ''} onChange={(event) => update('fat', numberValue(event.target.value))} /><Field label={t('customFood.fiber')} type="number" min="0" step="0.01" value={form.fiber ?? ''} onChange={(event) => update('fiber', numberValue(event.target.value))} /><Field label={t('customFood.sugar')} type="number" min="0" step="0.01" value={form.sugar ?? ''} onChange={(event) => update('sugar', numberValue(event.target.value))} /><Field label={t('customFood.sodium')} type="number" min="0" step="0.01" value={form.sodiumMg ?? ''} onChange={(event) => update('sodiumMg', numberValue(event.target.value))} /></div><TextAreaField label={t('customFood.notes')} value={form.notes ?? ''} onChange={(event) => update('notes', event.target.value)} />{(validation || error) && <div className="inline-error" role="alert">{validation || error}</div>}<div className="modal-actions"><NeonButton type="button" variant="ghost" onClick={onCancel}>{t('customFood.cancel')}</NeonButton><NeonButton type="submit" loading={saving}>{t('customFood.save')}</NeonButton></div></form>
}

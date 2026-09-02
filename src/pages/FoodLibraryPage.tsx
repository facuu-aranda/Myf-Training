import { Database, Heart, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageMotion } from '../components/PageMotion'
import { NutritionSubnav } from '../components/NutritionSubnav'
import { GlassCard, Field, IconButton, LoadingState, Modal, NeonButton, SearchField, SectionHeading, SelectField, StatusPill } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useFoodLibrary } from '../hooks/useFoodLibrary'
import { calculateNutrition } from '../lib/nutrition'
import { localizedFoodCategory, localizedFoodName, localizedFoodSubcategory } from '../lib/food'
import { formatNumber } from '../lib/utils'
import type { Food, FoodUnit } from '../types'

export function FoodLibraryPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const language = i18n.language.startsWith('es') ? 'es' : 'en'
  const { foods, totalCount, favoriteIds, search, setSearch, isLoading, isLoadingMore, hasMore, error, toggleFavorite, loadMore } = useFoodLibrary(user?.id)
  const [category, setCategory] = useState('all')
  const [selected, setSelected] = useState<Food | null>(null)
  const categories = useMemo(() => [...new Set(foods.map((food) => food.category).filter(Boolean))].sort((left, right) => left.localeCompare(right)), [foods])
  const filteredFoods = useMemo(() => category === 'all' ? foods : foods.filter((food) => food.category === category), [category, foods])

  if (!user) return null
  return <PageMotion>
    <div className="page-header">
      <div><span className="eyebrow-label">{t('nav.nutrition')}</span><h1>{t('nutrition.foods')}</h1><p>{t('nutrition.foodsSubtitle')}</p></div>
      <StatusPill tone="violet"><Database size={13} />{totalCount || foods.length} {t('nutrition.results')}</StatusPill>
    </div>
    <NutritionSubnav />
    <section className="food-library">
      <SectionHeading eyebrow={t('nutrition.imported')} title={t('nutrition.title')} description={t('nutrition.subtitle')} />
      <div className="food-library-toolbar">
        <SearchField value={search} onChange={setSearch} placeholder={t('nutrition.searchPlaceholder')} />
        <SelectField className="food-category-select" aria-label={t('nutrition.category')} value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">{t('common.all')}</option>
          {categories.map((item) => { const food = foods.find((candidate) => candidate.category === item); return <option key={item} value={item}>{food ? localizedFoodCategory(food, language) : item}</option> })}
        </SelectField>
      </div>
      {error && <div className="inline-error" role="alert">{error}</div>}
      {isLoading ? <LoadingState /> : filteredFoods.length ? <div className="food-results">
        <div className="food-grid">
          {filteredFoods.map((food) => <FoodCard key={food.id} food={food} language={language} favorite={favoriteIds.has(food.id)} onOpen={() => setSelected(food)} onToggleFavorite={() => { void toggleFavorite(food.id) }} t={t} />)}
        </div>
        {hasMore && <div className="food-load-more"><NeonButton variant="secondary" size="sm" onClick={() => { void loadMore() }} loading={isLoadingMore}>{t('nutrition.loadMore')}</NeonButton></div>}
      </div> : <GlassCard><div className="empty-state"><span className="empty-icon"><Search size={18} /></span><h3>{t('nutrition.noFoods')}</h3><p>{t('nutrition.foodsSubtitle')}</p></div></GlassCard>}
    </section>
    <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={t('nutrition.details')} size="lg">{selected && <FoodDetail food={selected} language={language} t={t} />}</Modal>
  </PageMotion>
}

function nutrientValue(value: number | null, unit: string) { return value === null ? '—' : `${formatNumber(value, value % 1 ? 1 : 0)}${unit}` }

function FoodCard({ food, language, favorite, onOpen, onToggleFavorite, t }: { food: Food; language: 'en' | 'es'; favorite: boolean; onOpen: () => void; onToggleFavorite: () => void; t: (key: string) => string }) {
  const nutrients = food.nutrients.find((item) => item.basis === 'per_100g')
  return <GlassCard className="food-card" hover onClick={onOpen}>
    <div className="food-card-head">
      <div><span className="eyebrow-label">{localizedFoodCategory(food, language) || t('nutrition.uncategorized')}</span><h3>{localizedFoodName(food, language)}</h3></div>
      <IconButton type="button" label={t('nutrition.favorite')} onClick={(event) => { event.stopPropagation(); onToggleFavorite() }}><Heart size={15} fill={favorite ? 'currentColor' : 'none'} /></IconButton>
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

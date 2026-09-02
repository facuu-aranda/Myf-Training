import { CalendarDays, Check, Plus, RefreshCw, ShoppingCart, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { PageMotion } from '../components/PageMotion'
import { NutritionSubnav } from '../components/NutritionSubnav'
import { EmptyState, Field, GlassCard, IconButton, LoadingState, Modal, NeonButton, SelectField, StatusPill } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { effectivePurchase, generateGroceryItems, mergeGroceryItems } from '../lib/grocery'
import { loadGroceryList, loadGroceryLists, loadMealPlansForHousehold, loadRecipes, loadUserCoupleId, saveGroceryList } from '../lib/repository'
import { subscribeToNutritionChanges } from '../lib/supabase'
import { formatDate, formatNumber, getDateKey, getStartOfWeek, uid } from '../lib/utils'
import type { GroceryItemCategory, GroceryItemSource, GroceryList, GroceryListItem, GroceryPurchaseUnit } from '../types'

const horizons = [7, 14, 28] as const
type Horizon = typeof horizons[number]
const categories: GroceryItemCategory[] = ['produce', 'protein', 'dairy', 'grains', 'pantry', 'frozen', 'beverages', 'snacks', 'other']
const purchaseUnits: GroceryPurchaseUnit[] = ['g', 'kg', 'ml', 'l', 'unit', 'dozen']

function addDays(date: Date, amount: number) { const result = new Date(date); result.setDate(result.getDate() + amount); return result }
function sourceLabel(source: GroceryItemSource, t: (key: string) => string) { return source === 'recipe-derived' ? t('nutrition.recipeDerived') : source === 'planned' ? t('nutrition.planned') : t('nutrition.manual') }
function itemName(item: GroceryListItem, language: 'en' | 'es') { return language === 'es' ? item.nameEs || item.name : item.nameEn || item.name }
function emptyList(userId: string, coupleId: string, startsOn: string, endsOn: string): GroceryList { return { id: uid('grocery-list'), coupleId, createdBy: userId, startsOn, endsOn, status: 'current', items: [], createdAt: '', updatedAt: '' } }

export function GroceryPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const language = i18n.language.startsWith('es') ? 'es' : 'en'
  const locale = language === 'es' ? 'es-AR' : 'en-US'
  const [periodStart, setPeriodStart] = useState(() => getStartOfWeek())
  const [horizon, setHorizon] = useState<Horizon>(7)
  const startsOn = getDateKey(periodStart)
  const endsOn = getDateKey(addDays(periodStart, horizon - 1))
  const [list, setList] = useState<GroceryList | null>(null)
  const [history, setHistory] = useState<GroceryList[]>([])
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [manualOpen, setManualOpen] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError('')
    try {
      const nextCoupleId = await loadUserCoupleId(user.id)
      setCoupleId(nextCoupleId)
      if (!nextCoupleId) { setList(null); setHistory([]); return }
      const [current, previous] = await Promise.all([loadGroceryList(nextCoupleId, startsOn, endsOn), loadGroceryLists(nextCoupleId)])
      setList(current)
      setHistory(previous)
    } catch { setError(t('nutrition.groceryError')) } finally { setIsLoading(false) }
  }, [endsOn, startsOn, t, user])

  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => { const unsubscribe = subscribeToNutritionChanges(() => { void refresh() }); return unsubscribe }, [refresh])

  const persist = async (nextList: GroceryList) => {
    setError('')
    try { await saveGroceryList(nextList); setList(nextList); setNotice(t('nutrition.grocerySaved')); window.setTimeout(() => setNotice(''), 2400) } catch { setError(t('nutrition.groceryError')) }
  }

  const generate = async () => {
    if (!user || !coupleId) return
    setIsGenerating(true)
    setError('')
    try {
      const [plans, recipes] = await Promise.all([loadMealPlansForHousehold(user.id, coupleId, startsOn, endsOn), loadRecipes()])
      const calculated = generateGroceryItems(plans, recipes)
      const base = list ?? emptyList(user.id, coupleId, startsOn, endsOn)
      const items = mergeGroceryItems(calculated, base.items).map((item) => ({ ...item, groceryListId: base.id }))
      await persist({ ...base, startsOn, endsOn, items })
    } catch { setError(t('nutrition.groceryError')) } finally { setIsGenerating(false) }
  }

  const updateItem = async (item: GroceryListItem, patch: Partial<GroceryListItem>) => {
    if (!list) return
    const nextList = { ...list, items: list.items.map((current) => current.id === item.id ? { ...current, ...patch } : current) }
    await persist(nextList)
  }

  const removeItem = async (item: GroceryListItem) => {
    if (!list) return
    const nextList = { ...list, items: list.items.filter((current) => current.id !== item.id) }
    await persist(nextList)
  }

  const addManualItem = async (item: GroceryListItem) => {
    if (!list) return
    await persist({ ...list, items: [...list.items, { ...item, groceryListId: list.id }] })
    setManualOpen(false)
  }

  const grouped = useMemo(() => categories.map((category) => ({ category, items: list?.items.filter((item) => item.category === category) ?? [] })).filter((group) => group.items.length), [list])
  const purchased = list?.items.filter((item) => item.status === 'purchased').length ?? 0
  const periodLabel = `${formatDate(periodStart, locale, { month: 'short', day: 'numeric' })} – ${formatDate(addDays(periodStart, horizon - 1), locale, { month: 'short', day: 'numeric', year: 'numeric' })}`

  if (!user) return null
  return <PageMotion><div className="page-header"><div><span className="eyebrow-label">{t('nav.nutrition')}</span><h1>{t('nutrition.grocery')}</h1><p>{t('nutrition.grocerySubtitle')}</p></div><div className="grocery-header-meta"><StatusPill tone="violet"><ShoppingCart size={13} />{purchased}/{list?.items.length ?? 0}</StatusPill>{list && <span>{periodLabel}</span>}</div></div><NutritionSubnav /><section className="grocery-page"><div className="grocery-toolbar"><div className="grocery-period"><IconButton type="button" label={t('common.previous')} onClick={() => setPeriodStart((current) => addDays(current, -horizon))}>←</IconButton><strong><CalendarDays size={14} />{periodLabel}</strong><IconButton type="button" label={t('common.next')} onClick={() => setPeriodStart((current) => addDays(current, horizon))}>→</IconButton></div><div className="grocery-actions"><SelectField label={t('nutrition.horizon')} value={horizon} onChange={(event) => setHorizon(Number(event.target.value) as Horizon)}>{horizons.map((value) => <option key={value} value={value}>{value === 7 ? t('nutrition.sevenDays') : value === 14 ? t('nutrition.fourteenDays') : t('nutrition.twentyEightDays')}</option>)}</SelectField><NeonButton size="sm" onClick={() => { void generate() }} loading={isGenerating}><RefreshCw size={14} />{list ? t('nutrition.regenerateGrocery') : t('nutrition.generateGrocery')}</NeonButton>{list && <NeonButton size="sm" variant="ghost" onClick={() => setManualOpen(true)}><Plus size={14} />{t('nutrition.addGroceryItem')}</NeonButton>}</div></div>{notice && <div className="inline-success" role="status">{notice}</div>}{error && <div className="inline-error" role="alert">{error}</div>}{isLoading ? <LoadingState /> : !coupleId ? <GlassCard><EmptyState icon={<ShoppingCart size={20} />} title={t('nutrition.groceryError')} description={t('nutrition.grocerySubtitle')} /></GlassCard> : !list ? <GlassCard><EmptyState icon={<ShoppingCart size={20} />} title={t('nutrition.noGroceryItems')} description={t('nutrition.keepManual')} action={<NeonButton onClick={() => { void generate() }} loading={isGenerating}><RefreshCw size={14} />{t('nutrition.generateGrocery')}</NeonButton>} /></GlassCard> : !grouped.length ? <GlassCard><EmptyState icon={<ShoppingCart size={20} />} title={t('nutrition.noGroceryItems')} description={t('nutrition.keepManual')} action={<NeonButton size="sm" onClick={() => setManualOpen(true)}><Plus size={14} />{t('nutrition.addGroceryItem')}</NeonButton>} /></GlassCard> : <div className="grocery-groups">{grouped.map((group) => <section className="grocery-group" key={group.category}><div className="grocery-group-heading"><h2>{t(`nutrition.groceryCategories.${group.category}`)}</h2><span>{group.items.length}</span></div><div className="grocery-items">{group.items.map((item) => <GroceryItemCard key={item.id} item={item} language={language} t={t} onToggle={() => { void updateItem(item, { status: item.status === 'purchased' ? 'pending' : 'purchased' }) }} onAdjust={(patch) => { void updateItem(item, patch) }} onDelete={() => { void removeItem(item) }} />)}</div></section>)}</div>}{history.length > 0 && <GroceryHistory history={history} locale={locale} t={t} onSelect={(previous) => { setPeriodStart(new Date(`${previous.startsOn}T12:00:00`)); const duration = Math.round((new Date(`${previous.endsOn}T12:00:00`).getTime() - new Date(`${previous.startsOn}T12:00:00`).getTime()) / 86400000) + 1; setHorizon(duration === 14 || duration === 28 ? duration : 7) }} />}<Modal open={manualOpen} onClose={() => setManualOpen(false)} title={t('nutrition.addGroceryItem')}><ManualGroceryItemForm listId={list?.id ?? ''} t={t} onCancel={() => setManualOpen(false)} onSave={addManualItem} /></Modal></section></PageMotion>
}

function GroceryHistory({ history, locale, t, onSelect }: { history: GroceryList[]; locale: string; t: (key: string) => string; onSelect: (list: GroceryList) => void }) {
  return <section className="grocery-history"><div className="grocery-history-heading"><h2>{t('nutrition.groceryHistory')}</h2><span>{history.length}</span></div><div className="grocery-history-list">{history.map((list) => <button type="button" className="grocery-history-row" key={list.id} onClick={() => onSelect(list)}><span>{formatDate(list.startsOn, locale, { month: 'short', day: 'numeric' })} – {formatDate(list.endsOn, locale, { month: 'short', day: 'numeric', year: 'numeric' })}</span><strong>{t(`nutrition.groceryStatuses.${list.status}`)}</strong><small>{list.items.length} {t('nutrition.groceryItems').toLowerCase()}</small></button>)}</div></section>
}

function GroceryItemCard({ item, language, t, onToggle, onAdjust, onDelete }: { item: GroceryListItem; language: 'en' | 'es'; t: (key: string) => string; onToggle: () => void; onAdjust: (patch: Partial<GroceryListItem>) => void; onDelete: () => void }) {
  const [quantity, setQuantity] = useState(item.manualQuantity === null ? '' : String(item.manualQuantity))
  const [unit, setUnit] = useState<GroceryPurchaseUnit>(item.manualUnit ?? item.suggestedUnit ?? item.calculatedUnit ?? 'unit')
  const purchase = effectivePurchase(item)
  useEffect(() => { setQuantity(item.manualQuantity === null ? '' : String(item.manualQuantity)); setUnit(item.manualUnit ?? item.suggestedUnit ?? item.calculatedUnit ?? 'unit') }, [item.calculatedUnit, item.manualQuantity, item.manualUnit, item.suggestedUnit])
  const saveAdjustment = (nextUnit = unit) => { const parsed = Number(quantity); const hasQuantity = quantity.trim() && Number.isFinite(parsed) && parsed > 0; onAdjust({ manualQuantity: hasQuantity ? parsed : null, manualUnit: hasQuantity ? nextUnit : null }) }
  const purchaseLabel = purchase.manual ? t('nutrition.manual') : t('nutrition.suggestedPurchase')
  return <div className={`grocery-item ${item.status === 'purchased' ? 'purchased' : ''}`}><button type="button" className="grocery-check" aria-label={item.status === 'purchased' ? t('nutrition.markPending') : t('nutrition.markPurchased')} onClick={onToggle}>{item.status === 'purchased' && <Check size={14} />}</button><div className="grocery-item-main"><strong>{itemName(item, language)}</strong><div className="grocery-item-detail"><span>{purchaseLabel}: {formatNumber(purchase.quantity, 2)} {purchase.unit}</span><span className="grocery-item-source">{sourceLabel(item.source, t)}</span></div></div><div className="grocery-item-adjust"><input aria-label={t('nutrition.groceryItemQuantity')} type="number" min="0" step="0.01" placeholder={String(item.suggestedQuantity ?? item.calculatedQuantity ?? '')} value={quantity} onChange={(event) => setQuantity(event.target.value)} onBlur={() => saveAdjustment()} /><select aria-label={t('nutrition.groceryItemUnit')} value={unit} onChange={(event) => { const nextUnit = event.target.value as GroceryPurchaseUnit; setUnit(nextUnit); saveAdjustment(nextUnit) }}>{purchaseUnits.map((value) => <option key={value} value={value}>{value}</option>)}</select></div><IconButton type="button" label={t('common.remove')} onClick={onDelete}><Trash2 size={14} /></IconButton></div>
}

function ManualGroceryItemForm({ listId, t, onCancel, onSave }: { listId: string; t: (key: string) => string; onCancel: () => void; onSave: (item: GroceryListItem) => Promise<void> }) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState<GroceryPurchaseUnit>('unit')
  const [category, setCategory] = useState<GroceryItemCategory>('other')
  const [validation, setValidation] = useState('')
  const submit = (event: FormEvent) => { event.preventDefault(); const parsed = Number(quantity); if (!name.trim() || !Number.isFinite(parsed) || parsed <= 0) { setValidation(t('errors.required')); return } const item: GroceryListItem = { id: uid('grocery-item'), groceryListId: listId, foodId: null, name: name.trim(), nameEs: name.trim(), nameEn: name.trim(), category, source: 'manual', calculatedQuantity: null, calculatedUnit: null, manualQuantity: parsed, manualUnit: unit, suggestedQuantity: parsed, suggestedUnit: unit, status: 'pending', notes: '', metadata: {}, createdAt: '', updatedAt: '' }; void onSave(item) }
  return <form className="manual-grocery-form" onSubmit={submit}><Field label={t('nutrition.groceryItemName')} value={name} onChange={(event) => setName(event.target.value)} autoFocus /><div className="settings-grid"><Field label={t('nutrition.groceryItemQuantity')} type="number" min="0" step="0.01" value={quantity} onChange={(event) => setQuantity(event.target.value)} /><SelectField label={t('nutrition.groceryItemUnit')} value={unit} onChange={(event) => setUnit(event.target.value as GroceryPurchaseUnit)}>{purchaseUnits.map((value) => <option key={value} value={value}>{value}</option>)}</SelectField><SelectField label={t('nutrition.category')} value={category} onChange={(event) => setCategory(event.target.value as GroceryItemCategory)}>{categories.map((value) => <option key={value} value={value}>{t(`nutrition.groceryCategories.${value}`)}</option>)}</SelectField></div>{validation && <div className="inline-error" role="alert">{validation}</div>}<div className="modal-actions"><NeonButton type="button" variant="ghost" onClick={onCancel}>{t('common.cancel')}</NeonButton><NeonButton type="submit"><Plus size={14} />{t('nutrition.addGroceryItem')}</NeonButton></div></form>
}

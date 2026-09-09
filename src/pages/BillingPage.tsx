import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, ShieldCheck } from 'lucide-react'
import { PageHeader, GlassCard, NeonButton, StatusPill } from '../components/ui'
import { COMMERCIAL_PLANS, useEntitlements } from '../lib/entitlements'
import { formatMinorAmount, loadPublicPlanPrices, useBillingSubscription, type PublicPlanPrice } from '../lib/billing'

export function BillingPage() {
  const { entitlements, aiUsage, value } = useEntitlements()
  const { subscription, isLoading: subscriptionLoading, createProviderCheckout } = useBillingSubscription()
  const [prices, setPrices] = useState<PublicPlanPrice[]>([])
  const [checkoutMessage, setCheckoutMessage] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const historyDays = Number(value('history_days', 30))
  const fallbackPlan = useMemo(() => COMMERCIAL_PLANS[0], [])
  useEffect(() => { void loadPublicPlanPrices().then(setPrices).catch(() => setPrices([])) }, [])
  const monthlyPrices = prices.filter((price) => price.interval === 'month' && price.planCode !== 'free')
  const choosePlan = async (price: PublicPlanPrice) => {
    setCheckoutLoading(true)
    setCheckoutMessage('')
    try {
      const checkout = await createProviderCheckout(price.id)
      setCheckoutMessage(`Redirigiendo al checkout Sandbox de ${price.planName}...`)
      window.location.assign(checkout.redirectUrl)
    } catch (error) {
      setCheckoutMessage(error instanceof Error ? error.message : 'No se pudo crear el checkout intent.')
    } finally { setCheckoutLoading(false) }
  }
  return <div className="page-content"><PageHeader eyebrow="Cuenta" title="Plan y facturación" description="Consulta tu suscripción y prepara tu próximo checkout de forma segura." /><div className="content-grid content-grid-two"><GlassCard><div className="section-heading"><div><span className="eyebrow-label">Plan efectivo</span><h2>{subscription?.planName ?? fallbackPlan.name}</h2></div><StatusPill tone={subscription ? 'green' : 'muted'} dot>{subscriptionLoading ? 'Consultando' : subscription?.status ?? 'Free'}</StatusPill></div><p>{subscription ? `Vigente hasta ${new Date(subscription.currentPeriodEnd).toLocaleDateString('es-AR')}.` : fallbackPlan.description}</p>{subscription && <><div className="billing-summary"><span><CreditCard size={16} /> Precio</span><strong>{formatMinorAmount(subscription.amountMinor, subscription.currency)} / {subscription.interval === 'month' ? 'mes' : 'año'}</strong></div><div className="billing-summary"><span><ShieldCheck size={16} /> Provider</span><strong>{subscription.status === 'active' ? 'Suscripción activa' : subscription.status}</strong></div></>}<div className="billing-summary"><span><ShieldCheck size={16} /> Ads</span><strong>{entitlements.ad_free ? 'No incluidos' : 'Base preparada'}</strong></div></GlassCard><GlassCard><span className="eyebrow-label">Tus capacidades</span><h2>Todo en un solo lugar</h2><ul className="billing-entitlements"><li>Historial: {historyDays === -1 ? 'completo' : `${historyDays} días`}</li><li>AI: {aiUsage ? `${aiUsage.used} / ${aiUsage.limit} interacciones usadas` : `${value('ai_monthly_interactions', 0)} por período`}</li><li>Household: {value('household_max_members', 0) || 'no disponible'}</li><li>Atletas: {value('coaching_max_athletes', 0) || 'no disponible'}</li></ul><Link to="/#pricing"><NeonButton variant="secondary">Comparar planes</NeonButton></Link></GlassCard></div>{!subscription && <section className="billing-upgrades"><PageHeader eyebrow="Siguiente paso" title="Elegir un plan" description="Se crea un intent interno; todavía no se redirige a Mercado Pago." /><div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>{monthlyPrices.map((price) => <GlassCard key={price.id}><span className="eyebrow-label">{price.planName}</span><h3>{formatMinorAmount(price.amountMinor, price.currency)} / mes</h3><NeonButton size="sm" onClick={() => { void choosePlan(price) }} loading={checkoutLoading}>Preparar checkout</NeonButton></GlassCard>)}</div>{checkoutMessage && <div className="inline-success" role="status">{checkoutMessage}</div>}</section>}</div>
}

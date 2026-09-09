import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Clock3 } from 'lucide-react'
import { GlassCard, NeonButton, PageHeader } from '../components/ui'
import { useBillingSubscription } from '../lib/billing'
import { supabase } from '../lib/supabase'

export function BillingReturnPage() {
  const { subscription, refresh } = useBillingSubscription()
  const [isChecking, setIsChecking] = useState(true)
  const [checkoutStatus, setCheckoutStatus] = useState('created')
  useEffect(() => {
    let active = true
    let attempts = 0
    const check = async () => {
      await refresh()
      if (!supabase) { if (active) setIsChecking(false); return }
      const intent = await supabase.from('billing_checkout_intents').select('status').order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (!active) return
      setCheckoutStatus(String(intent.data?.status ?? 'created'))
      attempts += 1
      if (subscription?.status === 'active' || attempts >= 6) setIsChecking(false)
      else window.setTimeout(() => { void check() }, 5000)
    }
    void check()
    return () => { active = false }
  }, [refresh, subscription?.status])
  const active = subscription?.status === 'active'
  return <div className="page-content"><PageHeader eyebrow="Billing" title={active ? 'Suscripción confirmada' : 'Confirmando suscripción'} description={active ? 'Tu acceso se actualizó desde el estado interno de billing.' : 'El proveedor puede tardar unos instantes en confirmar el pago. No activamos planes desde la URL de retorno.'} /><GlassCard><div className="empty-state"><span className="empty-icon">{active ? <CheckCircle2 size={22} /> : <Clock3 size={22} />}</span><h3>{active ? subscription.planName : isChecking ? 'Esperando confirmación del webhook' : `Estado: ${checkoutStatus}`}</h3><p>{active ? `Vigente hasta ${new Date(subscription.currentPeriodEnd).toLocaleDateString('es-AR')}.` : 'Mercado Pago debe notificar al webhook antes de actualizar tus entitlements.'}</p><Link to="/app/billing"><NeonButton variant="secondary">Volver a billing</NeonButton></Link></div></GlassCard></div>
}

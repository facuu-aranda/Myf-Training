import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LockKeyhole } from 'lucide-react'
import { useEntitlements, type EntitlementKey } from '../lib/entitlements'
import { GlassCard, NeonButton } from './ui'

export function UpgradePrompt({ entitlement, plan = 'plus' }: { entitlement: EntitlementKey; plan?: string }) {
  return <GlassCard className="feature-upgrade-prompt" data-entitlement={entitlement}><LockKeyhole size={18} /><div><strong>Disponible en {plan}</strong><span>Actualiza tu plan para desbloquear esta capacidad.</span></div><Link to="/#pricing"><NeonButton size="sm" variant="secondary">Ver planes</NeonButton></Link></GlassCard>
}

export function FeatureGate({ entitlement, children, fallback, plan }: { entitlement: EntitlementKey; children: ReactNode; fallback?: ReactNode; plan?: string }) {
  const { has, isLoading } = useEntitlements()
  if (isLoading || has(entitlement)) return <>{children}</>
  return <>{fallback ?? <UpgradePrompt entitlement={entitlement} plan={plan} />}</>
}

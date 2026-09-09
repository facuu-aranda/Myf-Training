import { ArrowRight, BarChart3, Check, Dumbbell, HeartHandshake, BrainCircuit, Users, Utensils, ClipboardList } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { GlassCard, NeonButton } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { COMMERCIAL_PLANS } from '../lib/entitlements'

const planFeatures: Record<string, string[]> = {
  free: ['Strategy y entrenamiento personal', 'Nutrition, Food Log y biblioteca', 'Historial de 30 días'],
  plus: ['Todo Free', 'AI limitada y analítica avanzada', 'Historial completo y exports'],
  couple: ['Beneficios Plus para dos', 'Grocery y Meal Planner compartidos', 'Progreso y actividad conjunta'],
  household: ['Beneficios Plus para cinco', 'Household, Grocery y Nutrition compartidos', 'Invitaciones y progreso conjunto'],
  coach_starter: ['Cuenta personal Plus', 'Coaching para 10 atletas activos', 'Strategy, progreso, historial y notas'],
  coach_pro: ['Todo Coach Starter', 'Hasta 30 atletas', 'Analytics, templates, reports y Needs Attention'],
}

export function LandingPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [interval, setInterval] = useState<'month' | 'year'>('month')
  const destination = user ? '/app' : '/login'
  const features = [
    { icon: Dumbbell, title: 'Entrenamiento personal', text: 'Strategy, Live Training, Manual Training y Quick Log en un mismo lugar.' },
    { icon: Utensils, title: 'Nutrición práctica', text: 'Food Library, recetas, Food Log, Meal Planner, Grocery e Insights.' },
    { icon: BarChart3, title: 'Progreso con contexto', text: 'Historial, métricas y tendencias para entender tu evolución.' },
    { icon: HeartHandshake, title: 'Juntos sin perder control', text: 'Comparte lo que tiene sentido en Couple y Household.' },
    { icon: ClipboardList, title: 'Coaching conectado', text: 'Tu coach administra tu Strategy mientras tú sigues usando la misma app.' },
    { icon: BrainCircuit, title: 'AI con propósito', text: 'Un asistente que trabaja sobre tu contexto disponible, sin promesas médicas.' },
  ]
  return <div className="landing-shell">
    <header className="public-header"><Link to="/" className="public-brand"><span className="brand-mark"><Dumbbell size={16} /></span><strong>nuvia<span>.</span></strong></Link><div className="public-header-right"><LanguageSwitcher compact />{user ? <Link to="/app">{t('nav.overview')}</Link> : <Link to="/login">{t('landing.signIn')}</Link>}</div></header>
    <main>
      <section className="landing-hero"><div className="landing-hero-copy"><span className="landing-eyebrow"><i />Training, nutrition and progress</span><motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>Tu progreso.<span>A tu manera.</span></motion.h1><p>Entrena, organiza tu nutrición y entiende tu evolución. Solo, acompañado o con tu coach.</p><div className="landing-actions"><Link to={destination}><NeonButton size="lg">Empezar gratis <ArrowRight size={16} /></NeonButton></Link><a href="#pricing" className="neon-button neon-button-ghost neon-button-lg">Ver planes</a></div><div className="landing-footnote"><span>Sin claims médicos.</span><span>Sin testimonios inventados.</span></div></div><div className="landing-visual" aria-label="Vista previa del producto"><div className="visual-glow" /><motion.div className="dashboard-preview" initial={{ opacity: 0, y: 25, rotateY: -7 }} animate={{ opacity: 1, y: 0, rotateY: -7 }} transition={{ delay: .2, duration: .75 }}><div className="preview-bar"><i /><i /><i /></div><div className="preview-body"><div className="preview-side"><strong>nu.</strong><span /><span /><span /><span /><span /></div><div className="preview-main"><div className="preview-greet" /><div className="preview-sub" /><div className="preview-rings"><div className="preview-stat-big"><div className="fake-ring" /><div className="preview-lines"><i /><i /><i /></div></div><div className="preview-stat-small"><i /><b /></div></div><div className="preview-workout"><div className="preview-workout-head"><i /><b /></div><div className="preview-exercises"><span /><span /><span /><span /></div></div></div></div></motion.div></div></section>
      <section className="landing-section"><div className="landing-section-head"><span className="eyebrow-label">Una base para todo tu proceso</span><h2>Menos fragmentos. Más claridad.</h2><p>Las herramientas que ya usas, conectadas alrededor de tu propia información.</p></div><div className="feature-grid">{features.map(({ icon: Icon, title, text }) => <GlassCard key={title} className="feature-card" hover><div className="feature-icon"><Icon size={17} /></div><h3>{title}</h3><p>{text}</p></GlassCard>)}</div></section>
      <section className="landing-section landing-callout"><div className="landing-section-head"><span className="eyebrow-label">Para personas y profesionales</span><h2>Tu app cambia contigo.</h2><p>Empieza con Free, crece con Plus, comparte tu rutina o trabaja con un coach sin duplicar tus datos.</p></div><div className="feature-grid"><GlassCard><Users size={22} /><h3>Couple y Household</h3><p>Cada persona mantiene sus datos. Compartan groceries, actividad y progreso cuando corresponda.</p></GlassCard><GlassCard><ClipboardList size={22} /><h3>Coaching real</h3><p>Invitaciones, Strategy gestionada, borradores, publicación, notas e historial para atletas.</p></GlassCard></div></section>
      <section className="landing-section" id="pricing"><div className="landing-section-head"><span className="eyebrow-label">Planes claros</span><h2>Elige cómo quieres usar Nuvia.</h2><p>Precios iniciales en ARS. Los planes anuales equivalen a 10 meses.</p><div style={{ display: 'inline-flex', gap: 4, padding: 4, marginTop: 18, border: '1px solid rgba(255,255,255,.12)', borderRadius: 999 }}><button className={interval === 'month' ? 'neon-button neon-button-secondary neon-button-sm' : 'neon-button neon-button-ghost neon-button-sm'} onClick={() => setInterval('month')}>Mensual</button><button className={interval === 'year' ? 'neon-button neon-button-secondary neon-button-sm' : 'neon-button neon-button-ghost neon-button-sm'} onClick={() => setInterval('year')}>Anual · 2 meses gratis</button></div></div><div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, maxWidth: 1200, margin: '0 auto' }}>{COMMERCIAL_PLANS.map((plan) => { const price = plan.prices.find((item) => item.interval === interval) ?? plan.prices[0]; return <GlassCard key={plan.code} className={`pricing-card ${plan.code === 'plus' ? 'pricing-card-featured' : ''}`}><span className="eyebrow-label">{['couple', 'household'].includes(plan.code) ? 'TOGETHER' : plan.code.startsWith('coach') ? 'PROFESSIONAL' : 'PERSONAL'}</span><h3>{plan.name}</h3><p>{plan.description}</p><div className="pricing-amount">{price.amountMinor === 0 ? '$0' : `$${(price.amountMinor / 100).toLocaleString('es-AR')}`}<small>{price.amountMinor ? interval === 'month' ? '/mes' : '/año' : ''}</small></div><ul>{planFeatures[plan.code].map((feature) => <li key={feature}><Check size={14} />{feature}</li>)}</ul><Link to={plan.code === 'free' ? destination : `/login?plan=${plan.code}&interval=${interval}`}><NeonButton size="lg" variant={plan.code === 'plus' ? 'primary' : 'secondary'}>{plan.code === 'free' ? 'Empezar gratis' : 'Elegir plan'}</NeonButton></Link></GlassCard> })}</div></section>
      <section className="landing-section landing-faq"><div className="landing-section-head"><span className="eyebrow-label">Preguntas frecuentes</span><h2>La base antes de cobrar.</h2></div><div className="feature-grid"><GlassCard><h3>¿Hay anuncios?</h3><p>La arquitectura ya reserva el entitlement para distinguir experiencias, pero la red publicitaria queda para una fase futura. Hoy no se sirven anuncios.</p></GlassCard><GlassCard><h3>¿Mercado Pago ya está activo?</h3><p>El catálogo, precios, suscripciones y mapping están preparados. El checkout real requiere configurar Edge Functions y credenciales sandbox.</p></GlassCard></div></section>
    </main><footer className="landing-footer"><span>© 2026 Nuvia / Train Together</span><span>Tu entrenamiento, tu contexto, tu progreso.</span></footer>
  </div>
}

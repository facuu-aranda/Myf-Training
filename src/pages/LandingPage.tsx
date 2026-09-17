import { ArrowRight, BarChart3, Check, Dumbbell, HeartHandshake, BrainCircuit, Users, Utensils, ClipboardList } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useState, type ReactNode } from 'react'
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

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: .55, ease: [0.22, 1, 0.36, 1] as const } },
}

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return <motion.div className={className} variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: true, amount: .18 }} transition={{ delay }}>{children}</motion.div>
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

      <section className="landing-section landing-features"><Reveal className="landing-section-head"><span className="eyebrow-label">Una base para todo tu proceso</span><h2>Menos fragmentos. Más claridad.</h2><p>Las herramientas que ya usas, conectadas alrededor de tu propia información.</p></Reveal><div className="feature-grid">{features.map(({ icon: Icon, title, text }, index) => <Reveal key={title} delay={index * .06}><GlassCard className="feature-card" hover><div className="feature-icon"><Icon size={17} /></div><h3>{title}</h3><p>{text}</p></GlassCard></Reveal>)}</div></section>

      <section className="landing-section landing-callout"><Reveal className="landing-section-head"><span className="eyebrow-label">Para personas y profesionales</span><h2>Tu app cambia contigo.</h2><p>Empieza con Free, crece con Plus, comparte tu rutina o trabaja con un coach sin duplicar tus datos.</p></Reveal><div className="landing-path-grid"><Reveal delay={.08}><GlassCard className="landing-path-card" hover><div className="landing-path-icon"><Users size={20} /></div><div><span className="landing-card-kicker">PARA COMPARTIR</span><h3>Couple y Household</h3><p>Cada persona mantiene sus datos. Compartan groceries, actividad y progreso cuando corresponda.</p></div><ArrowRight className="landing-path-arrow" size={18} /></GlassCard></Reveal><Reveal delay={.16}><GlassCard className="landing-path-card" hover><div className="landing-path-icon"><ClipboardList size={20} /></div><div><span className="landing-card-kicker">PARA AVANZAR</span><h3>Coaching real</h3><p>Invitaciones, Strategy gestionada, borradores, publicación, notas e historial para atletas.</p></div><ArrowRight className="landing-path-arrow" size={18} /></GlassCard></Reveal></div></section>

      <section className="landing-section landing-pricing-section" id="pricing"><Reveal className="landing-section-head"><span className="eyebrow-label">Planes claros</span><h2>Elige cómo quieres usar Nuvia.</h2><p>Precios iniciales en ARS. Los planes anuales equivalen a 10 meses.</p><div className="billing-toggle" role="group" aria-label="Periodicidad de cobro"><button type="button" className={interval === 'month' ? 'is-active' : ''} onClick={() => setInterval('month')}>Mensual</button><button type="button" className={interval === 'year' ? 'is-active' : ''} onClick={() => setInterval('year')}>Anual <span>2 meses gratis</span></button></div></Reveal><div className="pricing-grid">{COMMERCIAL_PLANS.map((plan, index) => { const price = plan.prices.find((item) => item.interval === interval) ?? plan.prices[0]; return <Reveal key={plan.code} delay={index * .045}><GlassCard className={`pricing-card ${plan.code === 'plus' ? 'pricing-card-featured' : ''}`}><div className="pricing-card-top"><span className="eyebrow-label">{['couple', 'household'].includes(plan.code) ? 'TOGETHER' : plan.code.startsWith('coach') ? 'PROFESSIONAL' : 'PERSONAL'}</span>{plan.code === 'plus' && <span className="pricing-badge">Popular</span>}</div><h3>{plan.name}</h3><p>{plan.description}</p><div className="pricing-amount">{price.amountMinor === 0 ? '$0' : `$${(price.amountMinor / 100).toLocaleString('es-AR')}`}<small>{price.amountMinor ? interval === 'month' ? '/mes' : '/año' : ''}</small></div><ul>{planFeatures[plan.code].map((feature) => <li key={feature}><Check size={14} />{feature}</li>)}</ul><Link className="pricing-card-action" to={plan.code === 'free' ? destination : `/login?plan=${plan.code}&interval=${interval}`}><NeonButton size="lg" variant={plan.code === 'plus' ? 'primary' : 'secondary'}>{plan.code === 'free' ? 'Empezar gratis' : 'Elegir plan'}</NeonButton></Link></GlassCard></Reveal> })}</div></section>

      <section className="landing-section landing-faq"><Reveal className="landing-section-head"><span className="eyebrow-label">Preguntas frecuentes</span><h2>La base antes de cobrar.</h2><p>Transparencia primero: conoce qué está disponible hoy y qué estamos preparando.</p></Reveal><div className="landing-faq-grid"><Reveal delay={.08}><GlassCard className="landing-faq-card" hover><span className="landing-card-kicker">PUBLICIDAD</span><h3>¿Hay anuncios?</h3><p>La arquitectura ya reserva el entitlement para distinguir experiencias, pero la red publicitaria queda para una fase futura. Hoy no se sirven anuncios.</p></GlassCard></Reveal><Reveal delay={.16}><GlassCard className="landing-faq-card" hover><span className="landing-card-kicker">MERCADO PAGO</span><h3>¿El checkout ya está activo?</h3><p>El catálogo, precios, suscripciones y mapping están preparados. El checkout real requiere configurar Edge Functions y credenciales sandbox.</p></GlassCard></Reveal></div></section>

      <Reveal className="landing-bottom-cta"><div><span className="eyebrow-label">Empieza con lo esencial</span><h2>Tu progreso merece un lugar claro.</h2><p>Organiza tu entrenamiento, nutrición y contexto en una sola experiencia.</p></div><Link to={destination}><NeonButton size="lg">Empezar gratis <ArrowRight size={16} /></NeonButton></Link></Reveal>
    </main><footer className="landing-footer"><span>© 2026 Nuvia / Train Together</span><span>Tu entrenamiento, tu contexto, tu progreso.</span></footer>
  </div>
}

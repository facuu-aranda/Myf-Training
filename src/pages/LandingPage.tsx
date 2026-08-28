import { Activity, ArrowRight, BarChart3, Check, Dumbbell, Heart, Sparkles, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { GlassCard, NeonButton } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'

export function LandingPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const destination = user ? '/app' : '/login'
  const features = [
    { icon: Activity, title: t('landing.live'), text: t('landing.plan') },
    { icon: BarChart3, title: t('landing.analytics'), text: t('landing.shared') },
    { icon: Users, title: t('nav.couple'), text: t('couple.subtitle') },
  ]
  return <div className="landing-shell">
    <header className="public-header"><Link to="/" className="public-brand"><span className="brand-mark"><Dumbbell size={16} /></span><strong>train<span>together</span></strong></Link><div className="public-header-right"><LanguageSwitcher compact />{user ? <Link to="/app">{t('nav.overview')}</Link> : <Link to="/login">{t('landing.signIn')}</Link>}</div></header>
    <main>
      <section className="landing-hero"><div className="landing-hero-copy"><span className="landing-eyebrow"><i />{t('landing.eyebrow')}</span><motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>{t('landing.titleOne')}<span>{t('landing.titleTwo')}</span></motion.h1><p>{t('landing.subtitle')}</p><div className="landing-actions"><Link to={destination}><NeonButton size="lg">{t('landing.cta')} <ArrowRight size={16} /></NeonButton></Link><Link to="/login" className="neon-button neon-button-ghost neon-button-lg">{t('landing.signIn')}</Link></div><div className="landing-footnote"><span className="avatar-wrap avatar-xs"><span className="avatar"><span>F</span></span></span><span className="avatar-wrap avatar-xs"><span className="avatar" style={{ background: 'linear-gradient(145deg,#db5ddc,#7a58d4)' }}><span>M</span></span></span><span>{t('landing.proof')}</span></div></div><div className="landing-visual" aria-label="Train Together dashboard preview"><div className="visual-glow" /><motion.div className="dashboard-preview" initial={{ opacity: 0, y: 25, rotateY: -7 }} animate={{ opacity: 1, y: 0, rotateY: -7 }} transition={{ delay: .2, duration: .75 }}><div className="preview-bar"><i /><i /><i /></div><div className="preview-body"><div className="preview-side"><strong>tt.</strong><span /><span /><span /><span /><span /></div><div className="preview-main"><div className="preview-greet" /><div className="preview-sub" /><div className="preview-rings"><div className="preview-stat-big"><div className="fake-ring" /><div className="preview-lines"><i /><i /><i /></div></div><div className="preview-stat-small"><i /><b /></div></div><div className="preview-workout"><div className="preview-workout-head"><i /><b /></div><div className="preview-exercises"><span /><span /><span /><span /></div></div></div></div></motion.div><div className="preview-floating"><span className="floating-check"><Check size={14} /></span><div><strong>Momentum shared</strong><span>Keep the rhythm going.</span></div></div></div></section>
      <section className="landing-section"><div className="landing-section-head"><span className="eyebrow-label">{t('appName')}</span><h2>{t('landing.subtitle')}</h2><p>{t('landing.proof')}</p></div><div className="feature-grid">{features.map(({ icon: Icon, title, text }) => <GlassCard key={title} className="feature-card" hover><div className="feature-icon"><Icon size={17} /></div><h3>{title}</h3><p>{text}</p></GlassCard>)}</div></section>
      <section className="landing-section" style={{ paddingTop: 30 }}><GlassCard className="shared-banner"><span className="shared-banner-icon"><Heart size={16} /></span><div><strong>{t('landing.shared')}</strong><p>{t('couple.subtitle')}</p></div><Sparkles size={16} style={{ marginLeft: 'auto', color: '#b78fff' }} /></GlassCard></section>
    </main>
    <footer className="landing-footer"><span>© 2026 Train Together</span><span>{t('landing.proof')}</span></footer>
  </div>
}

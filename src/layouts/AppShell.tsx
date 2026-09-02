import { AnimatePresence, motion } from 'framer-motion'
import { Activity, BarChart3, BookOpen, CalendarDays, Dumbbell, History, LayoutDashboard, LogOut, Menu, Settings2, Sparkles, Utensils, Users, X, Zap } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useFitness } from '../hooks/useFitness'
import { Avatar, IconButton, StatusPill } from '../components/ui'
import { cn } from '../lib/utils'

const navItems = [
  { to: '/app', key: 'overview', icon: LayoutDashboard, end: true },
  { to: '/app/strategy', key: 'strategy', icon: CalendarDays },
  { to: '/app/nutrition/foods', key: 'nutrition', icon: Utensils },
  { to: '/app/live', key: 'live', icon: Activity },
  { to: '/app/quick-log', key: 'quickLog', icon: Zap },
  { to: '/app/progress', key: 'progress', icon: BarChart3 },
  { to: '/app/history', key: 'history', icon: History },
  { to: '/app/couple', key: 'couple', icon: Users },
  { to: '/app/exercises', key: 'exercises', icon: BookOpen },
]
const mobileNavItems = navItems.filter(({ key }) => ['overview', 'live', 'nutrition', 'progress', 'couple'].includes(key))

export function AppShell() {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const { isRealtimeConnected } = useFitness()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const location = useLocation()
  const current = navItems.find((item) => item.end ? location.pathname === item.to : location.pathname.startsWith(item.to))

  if (!user) return null

  const navigation = <>
    <div className="sidebar-brand"><span className="brand-mark"><Dumbbell size={17} /></span><span className="brand-name">train<span>together</span></span></div>
    <div className="sidebar-section"><span className="sidebar-label">Workspace</span>{navItems.map(({ to, key, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => cn('nav-item', isActive && 'nav-item-active')} onClick={() => setMobileNavOpen(false)}><Icon size={17} strokeWidth={1.8} /><span>{t(`nav.${key}`)}</span>{key === 'live' && <i className="nav-live-dot" />}</NavLink>)}</div>
    <div className="sidebar-bottom"><NavLink to="/app/profile" className={({ isActive }) => cn('nav-item', isActive && 'nav-item-active')} onClick={() => setMobileNavOpen(false)}><Settings2 size={17} strokeWidth={1.8} /><span>{t('nav.profile')}</span></NavLink><div className="sidebar-user"><Avatar src={user.avatarUrl} name={user.displayName} size="sm" online /><div><strong>{user.firstName}</strong><span>@{user.username}</span></div><IconButton label={t('profile.signOut')} onClick={() => { void signOut() }}><LogOut size={15} /></IconButton></div></div>
  </>

  return <div className="app-shell">
    <aside className="desktop-sidebar">{navigation}</aside>
    <AnimatePresence>{mobileNavOpen && <><motion.div className="mobile-nav-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileNavOpen(false)} /><motion.aside className="mobile-sidebar" initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}>{navigation}<IconButton className="mobile-close" label="Close menu" onClick={() => setMobileNavOpen(false)}><X size={18} /></IconButton></motion.aside></>}</AnimatePresence>
    <main className="main-shell"><header className="topbar"><div className="topbar-left"><IconButton className="mobile-menu" label="Open menu" onClick={() => setMobileNavOpen(true)}><Menu size={20} /></IconButton><div className="breadcrumb"><Sparkles size={14} /><span>{t(`nav.${current?.key ?? 'overview'}`)}</span></div></div><div className="topbar-right"><StatusPill tone={isRealtimeConnected ? 'green' : 'muted'} dot>{isRealtimeConnected ? t('common.online') : t('common.local')}</StatusPill><NavLink to="/app/profile" className="topbar-profile"><Avatar src={user.avatarUrl} name={user.displayName} size="sm" /><span>{user.firstName}</span></NavLink></div></header><motion.div className="page-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .25 }}><Outlet /></motion.div></main>
    <nav className="mobile-bottom-nav">{mobileNavItems.map(({ to, key, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => cn(isActive && 'mobile-nav-active')}><Icon size={19} /><span>{t(`nav.${key}`)}</span></NavLink>)}</nav>
  </div>
}

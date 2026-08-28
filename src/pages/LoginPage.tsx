import { ArrowLeft, Dumbbell, LockKeyhole, UserRound } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { NeonButton, Field, Avatar, StatusPill } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'

export function LoginPage() {
  const { t } = useTranslation()
  const { user, signIn, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { if (user && !isLoading) navigate('/app', { replace: true }) }, [isLoading, navigate, user])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!username || !password) { setError(t('errors.required')); return }
    setError(''); setSubmitting(true)
    try { await signIn(username, password); navigate((location.state as { from?: string } | null)?.from ?? '/app', { replace: true }) } catch { setError(t('auth.invalid')) } finally { setSubmitting(false) }
  }

  return <div className="login-shell"><section className="login-visual"><Link to="/" className="public-brand" style={{ position: 'absolute', top: 28, left: 'clamp(25px, 7vw, 90px)' }}><span className="brand-mark"><Dumbbell size={16} /></span><strong>train<span>together</span></strong></Link><div className="login-visual-content"><span className="landing-eyebrow"><i />{t('landing.eyebrow')}</span><h1>{t('landing.titleOne')}<br /><span>{t('landing.titleTwo')}</span></h1><p>{t('landing.proof')}</p></div></section><section className="login-form-side"><Link to="/" className="login-back"><ArrowLeft size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />{t('auth.back')}</Link><div className="login-form-wrap"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span className="eyebrow-label">{t('appName')}</span><LanguageSwitcher compact /></div><h2>{t('auth.welcome')}</h2><p>{t('auth.subtitle')}</p><form className="login-form" onSubmit={submit}>{error && <div className="login-error" role="alert">{error}</div>}<Field label={t('auth.username')} value={username} onChange={(event) => setUsername(event.target.value)} placeholder={t('auth.usernamePlaceholder')} autoComplete="username" /><Field label={t('auth.password')} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t('auth.passwordPlaceholder')} autoComplete="current-password" /><NeonButton type="submit" size="lg" loading={submitting}>{submitting ? t('common.loading') : t('auth.submit')} <LockKeyhole size={15} /></NeonButton></form><div className="login-status"><i />{isSupabaseConfigured ? <StatusPill tone="green">{t('auth.configured')}</StatusPill> : <span>{t('auth.local')}</span>}</div><div className="demo-accounts"><span>{t('auth.demoHint')}</span><div className="demo-account-row"><button type="button" className="demo-account" onClick={() => setUsername('facundo')}><Avatar name="Facundo" size="xs" /><span>{t('auth.facundo')}</span></button><button type="button" className="demo-account" onClick={() => setUsername('maria')}><Avatar name="María" size="xs" /><span>{t('auth.maria')}</span></button></div><p style={{ margin: '10px 0 0', color: '#665d70', fontSize: 9 }}><UserRound size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />{t('auth.credentialsHint')}</p></div></div></section></div>
}

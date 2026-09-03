import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Search, Users } from 'lucide-react'
import { PageMotion } from '../components/PageMotion'
import { NeonButton, Field, GlassCard } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useFitness } from '../hooks/useFitness'
import { createHousehold, getMyHousehold } from '../lib/household'

export function OnboardingPage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const { updateProfile } = useFitness()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [handle, setHandle] = useState(user?.publicHandle || '')

  useEffect(() => {
    if (!user) return
    let active = true
    void getMyHousehold().then((current) => { if (active && !current) return createHousehold() }).catch((error: unknown) => { console.error('Train Together household onboarding failed', error instanceof Error ? error.message : error) })
    return () => { active = false }
  }, [user])

  if (!user) return null

  const handleNext = () => {
    if (step === 1) {
      if (handle !== user.publicHandle) {
        updateProfile(user.id, { publicHandle: handle })
      }
      setStep(2)
    } else {
      navigate('/app')
    }
  }

  return (
    <PageMotion>
      <div style={{ maxWidth: 500, margin: '60px auto', display: 'flex', flexDirection: 'column', gap: 30 }}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ textAlign: 'center', marginBottom: 30 }}>
                <span className="eyebrow-label">{t('onboarding.step', { current: 1 })}</span>
                <h1>{t('onboarding.identityTitle')}</h1>
                <p style={{ color: '#b2a5c4', marginTop: 10 }}>{t('onboarding.identitySubtitle')}</p>
              </div>
              <GlassCard style={{ padding: 30 }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(145deg, #db5ddc, #7a58d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', fontSize: 32, fontWeight: 700, color: '#fff' }}>
                    {user.displayName?.charAt(0) || user.username?.charAt(0) || 'U'}
                  </div>
                  <h3 style={{ margin: 0 }}>{user.displayName}</h3>
                </div>
                <Field label={t('onboarding.publicHandle')} value={handle} onChange={(e) => setHandle(e.target.value)} />
                <div style={{ marginTop: 20 }}>
                  <label style={{ fontSize: '10px', color: '#8e829d' }}>{t('onboarding.publicCode')}</label>
                  <strong style={{ display: 'block', fontSize: '16px', color: '#e5dafa', fontFamily: "'DM Mono', monospace", marginTop: 5 }}>{user.publicCode}</strong>
                </div>
                <NeonButton style={{ width: '100%', marginTop: 30 }} onClick={handleNext}>{t('common.continue')} <ArrowRight size={16} /></NeonButton>
              </GlassCard>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ textAlign: 'center', marginBottom: 30 }}>
                <span className="eyebrow-label">{t('onboarding.step', { current: 2 })}</span>
                <h1>{t('onboarding.findPersonTitle')}</h1>
                <p style={{ color: '#b2a5c4', marginTop: 10 }}>{t('onboarding.findPersonSubtitle')}</p>
              </div>
              <GlassCard style={{ padding: 30, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <NeonButton variant="secondary" onClick={() => navigate('/app/people')} style={{ width: '100%', padding: '20px 15px', display: 'flex', justifyContent: 'flex-start', gap: 15 }}>
                  <Search size={20} color="#b78fff" />
                  <div style={{ textAlign: 'left' }}>
                    <strong style={{ display: 'block', color: '#fff' }}>{t('onboarding.searchHandle')}</strong>
                    <span style={{ fontSize: 12, color: '#b2a5c4' }}>{t('onboarding.searchHandleSubtitle')}</span>
                  </div>
                </NeonButton>
              
                <div style={{ textAlign: 'center', color: '#8e829d', fontSize: 12, margin: '5px 0' }}>{t('common.or')}</div>

                <NeonButton variant="secondary" onClick={() => navigate('/app/household')} style={{ width: '100%', padding: '20px 15px', display: 'flex', justifyContent: 'flex-start', gap: 15 }}>
                  <Users size={20} color="#db5ddc" />
                  <div style={{ textAlign: 'left' }}>
                    <strong style={{ display: 'block', color: '#fff' }}>{t('onboarding.viewInvitations')}</strong>
                    <span style={{ fontSize: 12, color: '#b2a5c4' }}>{t('onboarding.viewInvitationsSubtitle')}</span>
                  </div>
                </NeonButton>

                <button onClick={handleNext} style={{ background: 'none', border: 'none', color: '#8e829d', textDecoration: 'underline', marginTop: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {t('onboarding.skip')}
                </button>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageMotion>
  )
}

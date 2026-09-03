import { Footprints, Heart, Share2, Sparkles, Zap, Check, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { CoupleNutritionPanel } from '../components/CoupleNutritionPanel'
import { PageMotion } from '../components/PageMotion'
import { ShareCardModal } from '../components/ShareCardModal'
import { Avatar, GlassCard, SectionHeading, StatusPill, NeonButton, Toast } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useFitness } from '../hooks/useFitness'
import { formatRelativeDate, getCoupleSummaries } from '../lib/analytics'
import { formatNumber } from '../lib/utils'
import { subscribeToSocialChanges } from '../lib/supabase'
import { getPendingInvitations, acceptInvitation, declineInvitation, getMyHousehold, removeHouseholdMember } from '../lib/household'
import type { HouseholdInvitation, Household, HouseholdMember } from '../types'

export function HouseholdPage() {
  const { t } = useTranslation()
  const [shareOpen, setShareOpen] = useState(false)
  const { user } = useAuth()
  const { profiles, nutritionPlans, exercises, workoutDays, sessions, dailyMetrics, personalRecords, activityEvents, isRealtimeConnected, refreshFromRemote } = useFitness()
  const [invitations, setInvitations] = useState<HouseholdInvitation[]>([])
  const [myHousehold, setMyHousehold] = useState<{ household: Household; members: HouseholdMember[] } | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const refreshHousehold = () => { void getPendingInvitations().then(setInvitations).catch(console.error); void getMyHousehold().then(setMyHousehold).catch(console.error) }
    refreshHousehold()
    const unsubscribe = subscribeToSocialChanges(() => { refreshHousehold(); void refreshFromRemote() })
    return unsubscribe
  }, [refreshFromRemote])

  const handleAccept = async (invitationId: string, householdId: string) => {
    try {
      await acceptInvitation(invitationId, householdId)
      setToast('Invitation accepted!')
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId))
      void refreshFromRemote()
    } catch {
      setToast('Could not accept invitation')
    }
  }

  const handleDecline = async (invitationId: string) => {
    try {
      await declineInvitation(invitationId)
      setToast('Invitation declined')
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId))
    } catch {
      setToast('Could not decline invitation')
    }
  }

  const handleRemoveMember = async (targetUserId: string) => {
    if (!myHousehold) return
    if (confirm(t('household.confirmRemove'))) {
      try {
        await removeHouseholdMember(myHousehold.household.id, targetUserId)
        setToast(t('household.memberRemoved'))
        await refreshFromRemote()
        const updated = await getMyHousehold()
        setMyHousehold(updated)
      } catch {
        setToast('Could not remove member')
      }
    }
  }

  if (!user) return null
  const state = { profiles, nutritionPlans, exercises, workoutDays, sessions, dailyMetrics, personalRecords, activityEvents }
  const memberIds = new Set(myHousehold?.members.map((member) => member.userId) ?? [user.id])
  const summaries = getCoupleSummaries(state).filter((summary) => memberIds.has(summary.profile.id))
  const maxSteps = Math.max(...summaries.map((summary) => summary.steps), 1)
  const maxWorkouts = Math.max(...summaries.map((summary) => summary.workouts), 1)
  const isOwner = myHousehold?.household.ownerUserId === user.id
  return <PageMotion><div className="page-header"><div><span className="eyebrow-label">{t('nav.household')}</span><h1>{t('household.title')}</h1><p>{t('household.subtitle')}</p></div><div className="page-header-actions"><StatusPill tone={isRealtimeConnected ? 'green' : 'violet'} dot>{isRealtimeConnected ? t('common.online') : t('common.local')}</StatusPill><button type="button" className="neon-button neon-button-secondary neon-button-sm" onClick={() => setShareOpen(true)}><Share2 size={13} />{t('share.button')}</button></div></div>
  
  {invitations.length > 0 && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
      {invitations.map((inv) => (
        <GlassCard key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px' }}>
          <div>
            <strong style={{ display: 'block', color: '#e5dafa' }}>{inv.household?.name || t('household.household')}</strong>
            <span style={{ color: '#a998bc', fontSize: '13px' }}>{t('household.invitedYou', { name: inv.inviter?.displayName ?? '' })}</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <NeonButton variant="secondary" size="sm" onClick={() => handleDecline(inv.id)}><X size={14} />{t('household.decline')}</NeonButton>
            <NeonButton size="sm" onClick={() => handleAccept(inv.id, inv.householdId)}><Check size={14} />{t('household.accept')}</NeonButton>
          </div>
        </GlassCard>
      ))}
    </div>
  )}

  <GlassCard className="shared-banner"><span className="shared-banner-icon"><Heart size={16} /></span><div><strong>{t('household.shared')}</strong><p>{t('household.sync')}</p></div><div className="couple-avatars">{summaries.map((summary) => <Avatar key={summary.profile.id} src={summary.profile.avatarUrl} name={summary.profile.displayName} size="sm" online />)}</div></GlassCard><CoupleNutritionPanel userId={user.id} profiles={profiles} /><div className="couple-hero">{summaries.map((summary, index) => <GlassCard className="couple-person" key={summary.profile.id} hover><div className="couple-person-head"><Avatar src={summary.profile.avatarUrl} name={summary.profile.displayName} size="lg" online /><div><h2>{summary.profile.displayName}</h2><p>{summary.profile.firstName} · {summary.streak} {t('household.streak').toLowerCase()}</p></div><div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>{myHousehold && summaries.length > 1 && (summary.profile.id === user.id ? (<button onClick={() => handleRemoveMember(user.id)} className="text-link" style={{ color: '#eb5e5e', fontSize: 12 }}>{t('household.leave')}</button>) : (isOwner && <button onClick={() => handleRemoveMember(summary.profile.id)} className="text-link" style={{ color: '#eb5e5e', fontSize: 12 }}>{t('household.remove')}</button>))}<span style={{ color: index === 0 ? '#bb98ff' : '#ed83db' }}>{index === 0 ? <Zap size={17} /> : <Sparkles size={17} />}</span></div></div><div className="couple-stat-grid"><div className="couple-stat"><span>{t('household.workouts')}</span><strong>{summary.workouts}</strong></div><div className="couple-stat"><span>{t('household.steps')}</span><strong>{formatNumber(summary.steps)}</strong></div><div className="couple-stat"><span>{t('household.records')}</span><strong>{summary.prs}</strong></div><div className="couple-stat"><span>{t('household.streak')}</span><strong>{summary.streak}d</strong></div></div></GlassCard>)}</div><div className="couple-layout"><GlassCard className="feed-card"><SectionHeading eyebrow={t('household.activity')} title={t('household.activity')} /><div className="activity-list">{activityEvents.slice(0, 8).map((event, index) => { const eventProfile = profiles.find((profile) => profile.id === event.userId); return <motion.div className="activity-row" key={event.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }}><Avatar src={eventProfile?.avatarUrl} name={eventProfile?.displayName ?? 'User'} size="sm" online /><div className="activity-copy"><p>{event.title}</p><span>{event.description}</span></div><time className="activity-time">{formatRelativeDate(event.createdAt)}</time></motion.div> })}{!activityEvents.length && <p style={{ color: '#867b91', fontSize: 11 }}>{t('household.noEvents')}</p>}</div></GlassCard><GlassCard className="week-card"><SectionHeading eyebrow={t('household.weekly')} title={t('household.weekly')} /><div className="couple-week-row">{summaries.map((summary) => <Avatar key={summary.profile.id} src={summary.profile.avatarUrl} name={summary.profile.displayName} size="md" online />)}<div className="couple-week-copy"><strong>{t('household.shared')}</strong><span>{t('household.subtitle')}</span></div></div>{summaries.map((summary) => <div className="pair-bar" key={summary.profile.id}><div className="pair-bar-label"><span>{summary.profile.firstName} · {t('household.steps')}</span><strong>{formatNumber(summary.steps)}</strong></div><div className="progress-track"><span style={{ width: `${summary.steps / maxSteps * 100}%` }} /></div></div>)}{summaries.map((summary) => <div className="pair-bar" key={`${summary.profile.id}-workouts`}><div className="pair-bar-label"><span>{summary.profile.firstName} · {t('household.workouts')}</span><strong>{summary.workouts}</strong></div><div className="progress-track"><span style={{ width: `${summary.workouts / maxWorkouts * 100}%`, background: 'linear-gradient(90deg,#ec76e6,#b784ff)' }} /></div></div>)}<div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 22, color: '#81758e', fontSize: 10 }}><Footprints size={13} color="#6ee7f9" />{t('household.sync')}</div></GlassCard></div><ShareCardModal open={shareOpen} onClose={() => setShareOpen(false)} title={t('household.title')} subtitle={t('household.subtitle')} tag={t('household.shared')} profiles={summaries.map((summary) => summary.profile)} fileName="our-progress.png" stats={[{ label: t('household.workouts'), value: formatNumber(summaries.reduce((sum, summary) => sum + summary.workouts, 0)) }, { label: t('household.steps'), value: formatNumber(summaries.reduce((sum, summary) => sum + summary.steps, 0)), accent: '#6ee7f9' }, { label: t('household.records'), value: formatNumber(summaries.reduce((sum, summary) => sum + summary.prs, 0)), accent: '#ed7bea' }, { label: t('household.streak'), value: `${Math.max(...summaries.map((summary) => summary.streak), 0)}d`, accent: '#f5ad74' }]} />
  {toast && <Toast message={toast} onClose={() => setToast('')} />}
  </PageMotion>
}

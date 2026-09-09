import { BriefcaseBusiness, CheckCircle2, Clock3, Search, Trash2, Users } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router-dom'
import { PageMotion } from '../components/PageMotion'
import { Avatar, EmptyState, Field, GlassCard, Modal, NeonButton, SectionHeading, SelectField } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { cancelCoachingInvitation, createCoachingSpace, getCoachingAthletes, getCoachingMemberIds, getMyCoachingSpaces, getPendingCoachingInvitations, getSentCoachingInvitations, hasCoachingCapability, inviteCoachingAthlete, removeCoachingAthlete, resendCoachingInvitation, respondToCoachingInvitation } from '../lib/coaching-space'
import { searchPublicProfiles } from '../lib/people'
import type { CoachingAthlete, PublicProfile, Space, SpaceInvitation } from '../types'

export function CoachDashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [spaces, setSpaces] = useState<Space[]>([])
  const [athletes, setAthletes] = useState<CoachingAthlete[]>([])
  const [invitations, setInvitations] = useState<SpaceInvitation[]>([])
  const [sentInvitations, setSentInvitations] = useState<SpaceInvitation[]>([])
  const [athleteResults, setAthleteResults] = useState<PublicProfile[]>([])
  const [memberIds, setMemberIds] = useState<string[]>([])
  const [selectedSpaceId, setSelectedSpaceId] = useState('')
  const [athleteQuery, setAthleteQuery] = useState('')
  const [name, setName] = useState('')
  const [maxMembers, setMaxMembers] = useState(5)
  const [isLoading, setIsLoading] = useState(true)
  const [capabilityLoading, setCapabilityLoading] = useState(true)
  const [canManageCoaching, setCanManageCoaching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [isResponding, setIsResponding] = useState(false)
  const [athleteToRemove, setAthleteToRemove] = useState<CoachingAthlete | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    void hasCoachingCapability().then((enabled) => { if (active) setCanManageCoaching(enabled) }).finally(() => { if (active) setCapabilityLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    void Promise.all([getMyCoachingSpaces(), getPendingCoachingInvitations()]).then(([result, pending]) => {
      if (!active) return
      setSpaces(result)
      setSelectedSpaceId(result[0]?.id ?? '')
      setInvitations(pending)
    }).catch(() => { if (active) setError(t('coach.loadError')) }).finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [t])

  useEffect(() => {
    if (!selectedSpaceId) { setAthletes([]); setSentInvitations([]); return }
    void getSentCoachingInvitations(selectedSpaceId).then(setSentInvitations).catch(() => setError(t('coach.loadError')))
  }, [selectedSpaceId, t])

  useEffect(() => {
    if (!selectedSpaceId) { setAthletes([]); return }
    let active = true
    void Promise.all([getCoachingAthletes(selectedSpaceId), getCoachingMemberIds(selectedSpaceId)]).then(([result, ids]) => { if (active) { setAthletes(result); setMemberIds(ids) } }).catch(() => { if (active) setError(t('coach.athletesError')) })
    return () => { active = false }
  }, [selectedSpaceId, t])

  if (!user) return null
  if (capabilityLoading) return <div className="app-loading"><span>{t('common.loading')}</span></div>
  if (!canManageCoaching) return <Navigate to="/app" replace />
  const selectedSpace = spaces.find((space) => space.id === selectedSpaceId)
  const availableSeats = selectedSpace ? Math.max(selectedSpace.maxMembers - athletes.length, 0) : 0

  const showNotice = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3000)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim() || isSaving) return
    setIsSaving(true)
    setError('')
    try {
      const space = await createCoachingSpace(name, maxMembers)
      setSpaces((current) => [space, ...current])
      setSelectedSpaceId(space.id)
      setName('')
      showNotice(t('coach.created'))
    } catch { setError(t('coach.createError')) } finally { setIsSaving(false) }
  }

  const searchAthletes = async (event: FormEvent) => {
    event.preventDefault()
    if (!athleteQuery.trim()) return
    try { setAthleteResults((await searchPublicProfiles(athleteQuery, 10)).filter((athlete) => !memberIds.includes(athlete.id) && athlete.id !== user.id)); setError('') } catch { setError(t('coach.searchError')) }
  }

  const inviteAthlete = async (athlete: PublicProfile) => {
    if (!selectedSpaceId || isInviting) return
    setIsInviting(true)
    try { await inviteCoachingAthlete(selectedSpaceId, athlete.id); showNotice(t('coach.invited')); setAthleteResults((current) => current.filter((item) => item.id !== athlete.id)) } catch { setError(t('coach.inviteError')) } finally { setIsInviting(false) }
  }

  const respondToInvitation = async (invitation: SpaceInvitation, accepted: boolean) => {
    if (isResponding) return
    setIsResponding(true)
    try { await respondToCoachingInvitation(invitation.id, accepted); setInvitations((current) => current.filter((item) => item.id !== invitation.id)); showNotice(accepted ? t('coach.invitationAccepted') : t('coach.invitationDeclined')) } catch { setError(t('coach.invitationError')) } finally { setIsResponding(false) }
  }
  const updateSentInvitation = async (invitation: SpaceInvitation, action: 'cancel' | 'resend') => {
    try { if (action === 'cancel') await cancelCoachingInvitation(invitation.id); else await resendCoachingInvitation(invitation.id); setSentInvitations((current) => action === 'cancel' ? current.filter((item) => item.id !== invitation.id) : current.map((item) => item.id === invitation.id ? { ...item, status: 'pending' } : item)); showNotice(action === 'cancel' ? t('coach.invitationCancelled') : t('coach.invitationResent')) } catch { setError(t('coach.invitationError')) }
  }

  const removeAthlete = async () => {
    if (!athleteToRemove || !selectedSpaceId || isRemoving) return
    setIsRemoving(true)
    try { await removeCoachingAthlete(selectedSpaceId, athleteToRemove.athleteUserId); setAthletes((current) => current.filter((athlete) => athlete.athleteUserId !== athleteToRemove.athleteUserId)); setMemberIds((current) => current.filter((id) => id !== athleteToRemove.athleteUserId)); setAthleteToRemove(null); showNotice(t('coach.athleteRemoved')) } catch { setError(t('coach.removeAthleteError')) } finally { setIsRemoving(false) }
  }

  return <PageMotion>
    <div className="coach-page">
      <div className="page-header coach-page-header"><div><span className="eyebrow-label">{t('nav.coach')}</span><h1>{t('coach.title')}</h1><p>{t('coach.subtitle')}</p></div><span className="coach-beta-pill"><BriefcaseBusiness size={13} />{t('coach.billingLater')}</span></div>
      {notice && <div className="inline-success" role="status">{notice}</div>}
      {error && <div className="inline-error" role="alert">{error}</div>}
      {isLoading ? <div className="app-loading"><span>{t('common.loading')}</span></div> : <>
        <div className="coach-metric-grid"><MetricCard icon={<BriefcaseBusiness size={16} />} value={spaces.length} label={t('coach.metricSpaces')} /><MetricCard icon={<Users size={16} />} value={athletes.length} label={t('coach.metricAthletes')} /><MetricCard icon={<CheckCircle2 size={16} />} value={selectedSpace ? availableSeats : '—'} label={t('coach.metricAvailable')} /></div>
        {invitations.length > 0 && <GlassCard className="coach-invitations-card"><SectionHeading eyebrow={t('coach.invitationsEyebrow')} title={t('coach.invitationsTitle')} description={t('coach.invitationsHint')} /><div className="coach-invitation-list">{invitations.map((invitation) => <div className="coach-invitation-row" key={invitation.id}><span className="coach-space-icon"><Clock3 size={16} /></span><div><strong>{invitation.spaceName ?? invitation.spaceId}</strong><span>{invitation.inviterName ?? invitation.inviterHandle ?? invitation.inviterUserId}</span></div><div className="coach-invitation-actions"><NeonButton size="sm" onClick={() => { void respondToInvitation(invitation, true) }} loading={isResponding}>{t('coach.accept')}</NeonButton><NeonButton size="sm" variant="ghost" onClick={() => { void respondToInvitation(invitation, false) }} disabled={isResponding}>{t('coach.decline')}</NeonButton></div></div>)}</div></GlassCard>}
        <div className="coach-space-selector"><SelectField label={t('coach.selectSpace')} value={selectedSpaceId} onChange={(event) => setSelectedSpaceId(event.target.value)}><option value="">{t('coach.selectSpacePlaceholder')}</option>{spaces.map((space) => <option value={space.id} key={space.id}>{space.name}</option>)}</SelectField>{selectedSpace && <span>{selectedSpace.maxMembers} {t('coach.seats')}</span>}</div>
        {sentInvitations.length > 0 && <GlassCard className="coach-sent-invitations"><SectionHeading eyebrow={t('coach.sentInvitationsEyebrow')} title={t('coach.sentInvitationsTitle')} description={t('coach.sentInvitationsHint')} /><div className="coach-invitation-list">{sentInvitations.map((invitation) => <div className="coach-invitation-row" key={invitation.id}><div><strong>{invitation.inviterName ?? invitation.inviteeUserId}</strong><span>{invitation.status === 'expired' ? t('coach.expired') : t('coach.pending')}</span></div><div className="coach-invitation-actions">{invitation.status === 'expired' && <NeonButton size="sm" onClick={() => { void updateSentInvitation(invitation, 'resend') }}>{t('coach.resend')}</NeonButton>}<NeonButton size="sm" variant="ghost" onClick={() => { void updateSentInvitation(invitation, 'cancel') }}>{t('coach.cancelInvitation')}</NeonButton></div></div>)}</div></GlassCard>}<div className="coach-dashboard-grid"><GlassCard><SectionHeading eyebrow={t('coach.createEyebrow')} title={t('coach.createTitle')} description={t('coach.createHint')} /><form className="settings-form" onSubmit={submit}><Field label={t('coach.spaceName')} value={name} onChange={(event) => setName(event.target.value)} placeholder={t('coach.spaceNamePlaceholder')} required /><Field label={t('coach.memberCapacity')} type="number" min="1" max="10000" value={maxMembers} onChange={(event) => setMaxMembers(Number(event.target.value) || 1)} /><NeonButton type="submit" loading={isSaving} disabled={!name.trim()}><BriefcaseBusiness size={14} />{t('coach.create')}</NeonButton></form></GlassCard><GlassCard><SectionHeading eyebrow={t('coach.athletesEyebrow')} title={t('coach.athletesTitle')} description={t('coach.athletesHint')} /><div className="coach-space-list">{athletes.length ? athletes.map((athlete) => <div className="coach-space-row" key={athlete.athleteUserId}><Link className="coach-athlete-link" to={`/app/coach/athletes/${selectedSpaceId}/${athlete.athleteUserId}`}><Avatar src={athlete.avatarUrl} name={athlete.displayName} size="sm" /><div><strong>{athlete.displayName}</strong><span>@{athlete.publicHandle} · {athlete.publicCode}</span></div></Link><NeonButton variant="danger" size="sm" onClick={() => setAthleteToRemove(athlete)}><Trash2 size={13} />{t('coach.removeAthlete')}</NeonButton></div>) : <EmptyState icon={<Users size={20} />} title={t('coach.noAthletesTitle')} description={t('coach.noAthletesDescription')} />}</div></GlassCard></div>
        <GlassCard className="coach-invite-card"><SectionHeading eyebrow={t('coach.inviteEyebrow')} title={t('coach.inviteTitle')} description={t('coach.inviteHint')} /><form className="coach-search-form" onSubmit={searchAthletes}><Field label={t('coach.searchAthlete')} value={athleteQuery} onChange={(event) => setAthleteQuery(event.target.value)} placeholder={t('coach.searchAthletePlaceholder')} /><NeonButton type="submit" disabled={!selectedSpaceId || !athleteQuery.trim()}><Search size={14} />{t('coach.search')}</NeonButton></form>{athleteResults.length > 0 && <div className="coach-space-list">{athleteResults.map((athlete) => <div className="coach-space-row" key={athlete.id}><Avatar src={athlete.avatarUrl} name={athlete.displayName} size="sm" /><div><strong>{athlete.displayName}</strong><span>@{athlete.publicHandle} · {athlete.publicCode}</span></div><NeonButton size="sm" onClick={() => { void inviteAthlete(athlete) }} loading={isInviting}>{t('coach.invite')}</NeonButton></div>)}</div>}</GlassCard>
      </>}
    </div>
    <Modal open={Boolean(athleteToRemove)} onClose={() => { if (!isRemoving) setAthleteToRemove(null) }} title={t('coach.removeAthleteTitle')}><div className="coach-remove-modal"><p>{t('coach.removeAthleteWarning')}</p><strong>{athleteToRemove?.displayName}</strong><div className="modal-actions"><NeonButton type="button" variant="ghost" onClick={() => setAthleteToRemove(null)} disabled={isRemoving}>{t('common.cancel')}</NeonButton><NeonButton type="button" variant="danger" onClick={() => { void removeAthlete() }} loading={isRemoving}><Trash2 size={14} />{t('coach.removeAthleteConfirm')}</NeonButton></div></div></Modal>
  </PageMotion>
}

function MetricCard({ icon, value, label }: { icon: ReactNode; value: string | number; label: string }) { return <div className="coach-metric-card"><span className="coach-space-icon">{icon}</span><strong>{value}</strong><span>{label}</span></div> }

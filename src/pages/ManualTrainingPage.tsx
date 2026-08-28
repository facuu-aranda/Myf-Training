import { ArrowLeft, Check, Clock3, Dumbbell, ListChecks, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { PageMotion } from '../components/PageMotion'
import { GlassCard, Field, NeonButton, SectionHeading, SelectField, StatusPill, TextAreaField } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useFitness } from '../hooks/useFitness'
import { calculateSessionVolume } from '../lib/analytics'
import { formatNumber, localizedName } from '../lib/utils'
import type { LiveSetDraft, WorkoutExercise } from '../types'

const defaultDraft = (plan?: WorkoutExercise): LiveSetDraft => ({ weight: plan?.targetWeight ? String(plan.targetWeight) : '', reps: plan?.targetReps ? String(plan.targetReps) : '', difficulty: 7, feeling: 4, pain: 0, notes: '' })

export function ManualTrainingPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { workoutDays, exercises, sessions, startSession, recordSet, removeSet, completeSession, getActiveSession } = useFitness()
  const navigate = useNavigate()
  const [dayId, setDayId] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [planId, setPlanId] = useState('')
  const [draft, setDraft] = useState<LiveSetDraft>(defaultDraft())
  const [startedAt, setStartedAt] = useState('')
  const days = useMemo(() => workoutDays.filter((day) => day.userId === user?.id && day.active).sort((a, b) => a.orderIndex - b.orderIndex), [user?.id, workoutDays])
  const day = days.find((item) => item.id === dayId) ?? days[0]
  const plans = day?.exercises.slice().sort((a, b) => a.orderIndex - b.orderIndex) ?? []
  const selectedPlan = plans.find((plan) => plan.id === planId) ?? plans[0]
  const session = sessions.find((item) => item.id === sessionId)
  const activeSession = user ? getActiveSession(user.id) : undefined
  const language = i18n.language.startsWith('es') ? 'es' : 'en'

  useEffect(() => { if (!dayId && day) setDayId(day.id) }, [day, dayId])
  useEffect(() => { if (selectedPlan && selectedPlan.id !== planId) { setPlanId(selectedPlan.id); setDraft(defaultDraft(selectedPlan)) } }, [planId, selectedPlan])
  useEffect(() => { if (activeSession && !sessionId) { setSessionId(activeSession.id); setDayId(activeSession.workoutDayId); setStartedAt(activeSession.startedAt) } }, [activeSession, sessionId])
  if (!user) return null

  const begin = () => { if (!day) return; const id = startSession(user.id, day.id); setSessionId(id); setStartedAt(new Date().toISOString()) }
  const logSet = () => { if (!sessionId || !selectedPlan || !draft.reps) return; recordSet(sessionId, selectedPlan, draft); setDraft(defaultDraft(selectedPlan)) }
  const finish = () => { if (!sessionId) return; const durationSeconds = startedAt ? Math.round((Date.now() - new Date(startedAt).getTime()) / 1000) : 0; completeSession(sessionId, { durationSeconds, overallFeeling: draft.feeling, energy: draft.feeling, fatigue: draft.difficulty > 8 ? 4 : 3, mood: draft.feeling, difficulty: draft.difficulty, notes: draft.notes }); setSessionId(''); navigate('/app/history') }
  const getExercise = (exerciseId: string) => exercises.find((exercise) => exercise.id === exerciseId)

  if (!sessionId && !activeSession) return <PageMotion><div className="page-header"><div><span className="eyebrow-label">{t('dashboard.manual')}</span><h1>{t('dashboard.manual')}</h1><p>{t('live.chooseSubtitle')}</p></div><NeonButton variant="ghost" size="sm" onClick={() => navigate('/app')}><ArrowLeft size={14} />{t('common.back')}</NeonButton></div><GlassCard className="manual-start-card"><SectionHeading eyebrow={t('strategy.trainingPlan')} title={t('live.choose')} description={t('live.chooseSubtitle')} /><div className="manual-day-select">{days.map((item) => <button type="button" className={item.id === day?.id ? 'manual-day active' : 'manual-day'} key={item.id} onClick={() => setDayId(item.id)}><span><Dumbbell size={15} /></span><strong>{localizedName(item, language)}</strong><small>{item.exercises.length} {t('common.sets')} · {item.estimatedMinutes} {t('common.min')}</small></button>)}</div><div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}><NeonButton size="lg" onClick={begin} disabled={!day}><Plus size={15} />{t('live.start')}</NeonButton></div></GlassCard></PageMotion>

  return <PageMotion><div className="page-header"><div><span className="eyebrow-label">{t('dashboard.manual')}</span><h1>{day ? localizedName(day, language) : t('dashboard.manual')}</h1><p>{t('strategy.subtitle')}</p></div><div style={{ display: 'flex', gap: 9 }}><StatusPill tone="orange" dot>{t('dashboard.manual')}</StatusPill><NeonButton variant="ghost" size="sm" onClick={finish}><Save size={14} />{t('live.finish')}</NeonButton></div></div><div className="manual-layout"><GlassCard className="manual-entry"><SectionHeading eyebrow={t('live.actual')} title={t('live.actual')} description={t('dashboard.manual')} /><div className="manual-form"><SelectField label={t('live.exercise')} value={selectedPlan?.id ?? ''} onChange={(event) => { const next = plans.find((plan) => plan.id === event.target.value); setPlanId(event.target.value); setDraft(defaultDraft(next)) }}>{plans.map((plan) => { const exercise = getExercise(plan.exerciseId); return <option value={plan.id} key={plan.id}>{exercise ? localizedName(exercise, language) : 'Exercise'}</option> })}</SelectField><div className="settings-grid"><Field label={t('live.weight')} type="number" min="0" step="0.5" value={draft.weight} onChange={(event) => setDraft((current) => ({ ...current, weight: event.target.value }))} /><Field label={t('live.reps')} type="number" min="0" value={draft.reps} onChange={(event) => setDraft((current) => ({ ...current, reps: event.target.value }))} /></div><div className="manual-rating-grid"><Field label={t('live.difficulty')} type="number" min="1" max="10" value={draft.difficulty} onChange={(event) => setDraft((current) => ({ ...current, difficulty: Number(event.target.value) || 1 }))} /><Field label={t('live.feeling')} type="number" min="1" max="5" value={draft.feeling} onChange={(event) => setDraft((current) => ({ ...current, feeling: Number(event.target.value) || 1 }))} /><Field label={t('live.pain')} type="number" min="0" max="10" value={draft.pain} onChange={(event) => setDraft((current) => ({ ...current, pain: Number(event.target.value) || 0 }))} /></div><TextAreaField label={t('live.notes')} value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} /><NeonButton size="lg" onClick={logSet} disabled={!selectedPlan || !draft.reps}><Check size={15} />{t('live.completeSet')}</NeonButton></div></GlassCard><GlassCard className="manual-log"><SectionHeading eyebrow={t('live.set')} title={t('live.set')} action={<StatusPill tone="violet">{session?.sets.length ?? 0} {t('common.complete')}</StatusPill>} />{session?.sets.length ? <div className="manual-set-list">{session.sets.slice().reverse().map((set) => { const exercise = getExercise(set.exerciseId); return <div className="manual-set-row" key={set.id}><span className="manual-set-number">{set.setNumber}</span><div><strong>{exercise ? localizedName(exercise, language) : 'Exercise'}</strong><small>RPE {set.difficulty} · {set.feeling}/5</small></div><b>{set.actualWeight} {t('common.kg')} × {set.actualReps}</b><button type="button" className="icon-button" aria-label={t('common.remove')} onClick={() => removeSet(sessionId, set.id)}><Trash2 size={13} /></button></div> })}</div> : <div className="manual-empty"><ListChecks size={20} /><p>{t('history.noSessions')}</p></div>}<div className="manual-summary"><span><Clock3 size={13} />{t('strategy.rest')}</span><strong>{selectedPlan?.restSeconds ?? 0}s</strong><span><Dumbbell size={13} />{t('history.volume')}</span><strong>{formatNumber(session ? calculateSessionVolume(session) : 0)} {t('common.kg')}</strong></div></GlassCard></div></PageMotion>
}

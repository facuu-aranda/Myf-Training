import { Check, Clock3, Dumbbell, Info, Save, Zap } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { PageMotion } from '../components/PageMotion'
import { ExerciseInfoModal } from '../components/ExerciseInfoModal'
import { GlassCard, Field, IconButton, NeonButton, SectionHeading, SelectField, StatusPill, TextAreaField } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useFitness } from '../hooks/useFitness'
import { localizedName } from '../lib/utils'
import type { Exercise, LiveSetDraft, QuickLogEntry } from '../types'

const defaultDraft = (plan: QuickLogEntry['plan']): QuickLogEntry => ({ plan, setsCompleted: plan.sets, draft: { weight: plan.targetWeight ? String(plan.targetWeight) : '', reps: plan.targetReps ? String(plan.targetReps) : '', difficulty: 7, feeling: 4, pain: 0, notes: '' } })

export function QuickLogPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { workoutDays, exercises, saveQuickSession, getActiveSession } = useFitness()
  const navigate = useNavigate()
  const [selectedDayId, setSelectedDayId] = useState('')
  const [entries, setEntries] = useState<Record<string, QuickLogEntry>>({})
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [error, setError] = useState('')
  const [notes, setNotes] = useState('')
  const days = useMemo(() => workoutDays.filter((day) => day.userId === user?.id && day.active).sort((a, b) => a.orderIndex - b.orderIndex), [user?.id, workoutDays])
  const day = days.find((item) => item.id === selectedDayId) ?? days[0]
  const plans = useMemo(() => day?.exercises.slice().sort((a, b) => a.orderIndex - b.orderIndex) ?? [], [day])
  const activeSession = user ? getActiveSession(user.id) : undefined
  const language = i18n.language.startsWith('es') ? 'es' : 'en'

  useEffect(() => { if (!selectedDayId && day) setSelectedDayId(day.id) }, [day, selectedDayId])
  useEffect(() => {
    if (!day) return
    setEntries((current) => plans.reduce<Record<string, QuickLogEntry>>((next, plan) => ({ ...next, [plan.id]: current[plan.id] ?? defaultDraft(plan) }), {}))
  }, [day, plans])
  if (!user) return null

  const updateEntry = (plan: QuickLogEntry['plan'], patch: { setsCompleted?: number; draft?: Partial<LiveSetDraft> }) => setEntries((current) => { const existing = current[plan.id] ?? defaultDraft(plan); return { ...current, [plan.id]: { ...existing, ...patch, draft: { ...existing.draft, ...patch.draft } } } })
  const getExercise = (exerciseId: string) => exercises.find((exercise) => exercise.id === exerciseId)
  const save = () => {
    if (!day || activeSession) return
    const selected = plans.map((plan) => entries[plan.id] ?? defaultDraft(plan)).filter((entry) => entry.setsCompleted > 0 && Number(entry.draft.reps) > 0)
    if (!selected.length) { setError(t('quick.required')); return }
    setError('')
    saveQuickSession(user.id, day.id, selected, { notes, durationSeconds: 0, overallFeeling: 4, energy: 4, fatigue: 3, mood: 4, difficulty: 7 })
    navigate('/app/history')
  }
  const totalSets = Object.values(entries).reduce((sum, entry) => sum + entry.setsCompleted, 0)
  return <PageMotion><div className="page-header"><div><span className="eyebrow-label">{t('nav.quickLog')}</span><h1>{t('quick.title')}</h1><p>{t('quick.subtitle')}</p></div><div style={{ display: 'flex', gap: 9 }}><Link to="/app/live" className="neon-button neon-button-secondary neon-button-sm"><Zap size={13} />{t('nav.live')}</Link><NeonButton size="sm" onClick={save} disabled={!day || Boolean(activeSession)}><Save size={13} />{t('quick.save')}</NeonButton></div></div>{activeSession && <div className="resume-banner"><div><strong>{t('live.resumeTitle')}</strong><p>{t('quick.activeHint')}</p></div><Link to="/app/live" className="neon-button neon-button-sm">{t('live.resume')}</Link></div>}<div className="quick-toolbar"><SelectField label={t('quick.workout')} value={day?.id ?? ''} onChange={(event) => { setSelectedDayId(event.target.value); setEntries({}); setError('') }}>{days.map((item) => <option value={item.id} key={item.id}>{localizedName(item, language)}</option>)}</SelectField><div className="quick-toolbar-summary"><span><Dumbbell size={14} />{plans.length} {t('common.exercises')}</span><span><Clock3 size={14} />{day?.estimatedMinutes ?? 0} {t('common.min')}</span><StatusPill tone="violet">{totalSets} {t('common.sets')}</StatusPill></div></div>{error && <div className="login-error" role="alert">{error}</div>}<div className="quick-log-list">{plans.map((plan, index) => { const exercise = getExercise(plan.exerciseId); const entry = entries[plan.id] ?? defaultDraft(plan); return <GlassCard className="quick-exercise-card" key={plan.id}><div className="quick-card-head"><div className="quick-exercise-visual">{exercise?.gifUrl ? <img src={exercise.gifUrl} alt="" /> : <Dumbbell size={22} />}</div><div className="quick-card-name"><span>{t('live.exercise')} {String(index + 1).padStart(2, '0')}</span><h2>{exercise ? localizedName(exercise, language) : t('common.exercise')}</h2><p>{t('live.planned')}: {plan.targetWeight || t('common.bodyWeight')} {plan.targetWeight ? t('common.kg') : ''} × {plan.targetReps} {t('common.reps')}</p></div><IconButton label={t('quick.viewExercise')} onClick={() => exercise && setSelectedExercise(exercise)}><Info size={16} /></IconButton></div><div className="quick-card-fields"><Field label={t('quick.setsDone')} type="number" min="0" max={plan.sets} value={entry.setsCompleted} onChange={(event) => updateEntry(plan, { setsCompleted: Math.min(plan.sets, Math.max(0, Number(event.target.value) || 0)) })} /><Field label={t('live.weight')} type="number" min="0" step="0.5" value={entry.draft.weight} onChange={(event) => updateEntry(plan, { draft: { weight: event.target.value } })} /><Field label={t('live.reps')} type="number" min="0" value={entry.draft.reps} onChange={(event) => updateEntry(plan, { draft: { reps: event.target.value } })} /><Field label={t('live.difficulty')} type="number" min="1" max="10" value={entry.draft.difficulty} onChange={(event) => updateEntry(plan, { draft: { difficulty: Number(event.target.value) || 1 } })} /><Field label={t('live.feeling')} type="number" min="1" max="5" value={entry.draft.feeling} onChange={(event) => updateEntry(plan, { draft: { feeling: Number(event.target.value) || 1 } })} /><Field label={t('live.pain')} type="number" min="0" max="10" value={entry.draft.pain} onChange={(event) => updateEntry(plan, { draft: { pain: Number(event.target.value) || 0 } })} /><TextAreaField className="quick-notes" label={t('live.notes')} value={entry.draft.notes} onChange={(event) => updateEntry(plan, { draft: { notes: event.target.value } })} /></div></GlassCard>})}</div><GlassCard className="quick-finish-card"><SectionHeading eyebrow={t('quick.finishEyebrow')} title={t('quick.finishTitle')} description={t('quick.finishDescription')} /><TextAreaField label={t('live.notes')} value={notes} onChange={(event) => setNotes(event.target.value)} /><NeonButton size="lg" onClick={save} disabled={!day || Boolean(activeSession)}><Check size={15} />{t('quick.save')}</NeonButton></GlassCard><ExerciseInfoModal exercise={selectedExercise} language={language} open={Boolean(selectedExercise)} onClose={() => setSelectedExercise(null)} /></PageMotion>
}

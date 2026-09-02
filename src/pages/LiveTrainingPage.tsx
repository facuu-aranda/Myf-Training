import { ArrowLeft, Check, ChevronRight, Clock3, Dumbbell, Info, Minus, Pause, Play, Plus, SkipForward, Share2, Sparkles, Trophy } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { PageMotion } from '../components/PageMotion'
import { ExerciseInfoModal } from '../components/ExerciseInfoModal'
import { ShareCardModal } from '../components/ShareCardModal'
import { GlassCard, Field, IconButton, NeonButton, SectionHeading, StatusPill, TextAreaField } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useFitness } from '../hooks/useFitness'
import { calculateSessionVolume } from '../lib/analytics'
import { formatNumber, formatTime, localizedName } from '../lib/utils'
import { getCompletedSetsForPlan, getNextLivePosition, type LivePosition } from '../lib/live'
import type { ExerciseSet, LivePhase, LiveSetDraft, Profile, WorkoutDay, WorkoutExercise, WorkoutSession } from '../types'

const blankDraft = (plan?: WorkoutExercise): LiveSetDraft => ({ weight: plan?.targetWeight ? String(plan.targetWeight) : '', reps: plan?.targetReps ? String(plan.targetReps) : '', difficulty: 7, feeling: 4, pain: 0, notes: '' })

export function LiveTrainingPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { workoutDays, exercises, sessions, getActiveSession, startSession, recordSet, completeSession, abandonSession } = useFitness()
  const navigate = useNavigate()
  const language = i18n.language.startsWith('es') ? 'es' : 'en'
  const userDays = useMemo(() => workoutDays.filter((day) => day.userId === user?.id && day.active).sort((a, b) => a.orderIndex - b.orderIndex), [user?.id, workoutDays])
  const [selectedDayId, setSelectedDayId] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [setIndex, setSetIndex] = useState(0)
  const [skippedSetCounts, setSkippedSetCounts] = useState<Record<string, number>>({})
  const [phase, setPhase] = useState<LivePhase>('ready')
  const [exerciseInfoOpen, setExerciseInfoOpen] = useState(false)
  const [draft, setDraft] = useState<LiveSetDraft>(blankDraft())
  const [restSeconds, setRestSeconds] = useState(0)
  const [restPaused, setRestPaused] = useState(false)
  const [restNextPosition, setRestNextPosition] = useState<LivePosition | null>(null)
  const [feedback, setFeedback] = useState({ energy: 4, fatigue: 3, mood: 4, overallFeeling: 4, difficulty: 7, notes: '' })
  const activeSession = user ? getActiveSession(user.id) : undefined
  const selectedDay = userDays.find((day) => day.id === selectedDayId) ?? userDays[0]
  const liveSession = sessions.find((session) => session.id === sessionId) ?? activeSession
  const currentPlan = selectedDay?.exercises.slice().sort((a, b) => a.orderIndex - b.orderIndex)[exerciseIndex]
  const currentExercise = exercises.find((exercise) => exercise.id === currentPlan?.exerciseId)
  const totalSets = selectedDay?.exercises.reduce((sum, plan) => sum + plan.sets, 0) ?? 0
  const completedSets = liveSession?.sets.length ?? 0
  const elapsed = liveSession ? Math.max(0, Math.round((Date.now() - new Date(liveSession.startedAt).getTime()) / 1000)) : 0

  useEffect(() => { if (!selectedDayId && userDays[0]) setSelectedDayId(userDays[0].id) }, [selectedDayId, userDays])
  useEffect(() => { if (currentPlan && phase === 'set') setDraft((current) => current.weight || current.reps ? current : blankDraft(currentPlan)) }, [currentPlan, phase])

  const syncToNextSet = useCallback((session: WorkoutSession, day: WorkoutDay) => {
    const position = getNextLivePosition(day, session.sets)
    if (!position) { setPhase('complete'); return }
    const sorted = day.exercises.slice().sort((a, b) => a.orderIndex - b.orderIndex)
    setExerciseIndex(position.exerciseIndex); setSetIndex(position.setIndex); setDraft(blankDraft(sorted[position.exerciseIndex])); setPhase('set')
  }, [])

  const begin = () => {
    if (activeSession) { resume(); return }
    if (!user || !selectedDay) return
    const id = startSession(user.id, selectedDay.id)
    setSessionId(id); setExerciseIndex(0); setSetIndex(0); setSkippedSetCounts({}); setDraft(blankDraft(selectedDay.exercises[0])); setPhase('set')
  }

  const resume = () => {
    if (!activeSession) return
    const day = userDays.find((item) => item.id === activeSession.workoutDayId)
    if (!day) return
    setSelectedDayId(day.id); setSessionId(activeSession.id); syncToNextSet(activeSession, day)
  }

  const advanceToPosition = useCallback((position: LivePosition | null) => {
    if (!selectedDay || !position) { setPhase('complete'); setRestNextPosition(null); return }
    const plans = selectedDay.exercises.slice().sort((a, b) => a.orderIndex - b.orderIndex)
    setExerciseIndex(position.exerciseIndex)
    setSetIndex(position.setIndex)
    setDraft(blankDraft(plans[position.exerciseIndex]))
    setRestNextPosition(null)
    setPhase('set')
  }, [selectedDay])

  const moveNext = useCallback((additionalSets: ExerciseSet[] = []) => {
    if (!selectedDay) return
    const completed = [...(liveSession?.sets ?? []), ...additionalSets]
    advanceToPosition(getNextLivePosition(selectedDay, completed, skippedSetCounts))
  }, [advanceToPosition, liveSession, selectedDay, skippedSetCounts])

  const advanceFromRest = useCallback(() => {
    if (restNextPosition) { advanceToPosition(restNextPosition); return }
    moveNext()
  }, [advanceToPosition, moveNext, restNextPosition])

  useEffect(() => {
    if (phase !== 'rest' || restPaused) return undefined
    const timer = window.setInterval(() => setRestSeconds((remaining) => Math.max(0, remaining - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [phase, restPaused])

  useEffect(() => {
    if (phase === 'rest' && restSeconds === 0) advanceFromRest()
  }, [advanceFromRest, phase, restSeconds])

  const skipSet = () => {
    if (!selectedDay || !currentPlan) return
    const nextSkippedSetCounts = { ...skippedSetCounts, [currentPlan.id]: (skippedSetCounts[currentPlan.id] ?? 0) + 1 }
    setSkippedSetCounts(nextSkippedSetCounts)
    advanceToPosition(getNextLivePosition(selectedDay, liveSession?.sets ?? [], nextSkippedSetCounts))
  }

  const completeSet = () => {
    if (!sessionId || !currentPlan) return
    const completedForPlan = selectedDay ? getCompletedSetsForPlan(selectedDay, exerciseIndex, liveSession?.sets ?? []) : 0
    const skippedForPlan = skippedSetCounts[currentPlan.id] ?? 0
    if (completedForPlan + skippedForPlan >= currentPlan.sets) { moveNext(); return }
    const recordedSet = recordSet(sessionId, currentPlan, draft)
    if (currentPlan.restSeconds > 0 && (completedForPlan + 1 < currentPlan.sets || exerciseIndex + 1 < (selectedDay?.exercises.length ?? 0))) {
      const nextPosition = selectedDay ? getNextLivePosition(selectedDay, [...(liveSession?.sets ?? []), ...(recordedSet ? [recordedSet] : [])], skippedSetCounts) : null
      setRestNextPosition(nextPosition)
      setRestSeconds(currentPlan.restSeconds)
      setRestPaused(false)
      setDraft(blankDraft(currentPlan))
      setPhase('rest')
    } else moveNext(recordedSet ? [recordedSet] : [])
  }

  const finish = () => {
    if (!sessionId) return
    completeSession(sessionId, { ...feedback, durationSeconds: elapsed })
    setPhase('ready'); setSessionId(''); setSkippedSetCounts({}); navigate('/app', { replace: true })
  }

  const discard = () => { if (activeSession) abandonSession(activeSession.id); setSessionId(''); setSkippedSetCounts({}); setPhase('ready') }
  if (!user) return null

  if (phase === 'ready') return <PageMotion><div className="page-header"><div><span className="eyebrow-label">{t('nav.live')}</span><h1>{t('live.title')}</h1><p>{t('live.subtitle')}</p></div><StatusPill tone="violet" dot>{t('live.ready')}</StatusPill></div>{activeSession && <div className="resume-banner"><div><strong>{t('live.resumeTitle')}</strong><p>{t('live.subtitle')}</p></div><div style={{ display: 'flex', gap: 8 }}><NeonButton variant="ghost" size="sm" onClick={discard}>{t('live.discard')}</NeonButton><NeonButton size="sm" onClick={resume}><Play size={13} fill="currentColor" />{t('live.resume')}</NeonButton></div></div>}<section className="live-page"><SectionHeading eyebrow={t('live.choose')} title={t('live.choose')} description={t('live.chooseSubtitle')} /><div className="live-select-grid">{userDays.map((day) => <GlassCard key={day.id} className={`live-day-card ${selectedDay?.id === day.id ? 'selected' : ''}`} hover onClick={() => setSelectedDayId(day.id)}><span className="day-card-icon"><Dumbbell size={16} /></span><h3>{localizedName(day, language)}</h3><p>{day.description}</p><div className="live-day-footer"><span><Dumbbell size={12} /> {day.exercises.length} {t('common.sets')}</span><span><Clock3 size={12} /> {day.estimatedMinutes} {t('common.min')}</span></div></GlassCard>)}</div><div style={{ display: 'flex', justifyContent: 'center', marginTop: 27 }}><NeonButton size="lg" onClick={begin} disabled={!selectedDay}><Play size={15} fill="currentColor" />{t('live.start')}</NeonButton></div></section></PageMotion>

  if (phase === 'complete') return <PageMotion><CompletionView session={liveSession} profile={user} elapsedSeconds={elapsed} feedback={feedback} setFeedback={setFeedback} onFinish={finish} t={t} /></PageMotion>

  return <PageMotion><section className="live-page"><div className="live-stage glass-card"><div className="live-stage-top"><button type="button" className="text-link" onClick={() => setPhase('ready')}><ArrowLeft size={14} /> {t('common.back')}</button><div className="stage-progress"><div className="stage-progress-label"><span>{t('live.exercise')} {exerciseIndex + 1} / {selectedDay?.exercises.length ?? 0}</span><span>{completedSets} / {totalSets} {t('common.complete')}</span></div><div className="progress-track"><span style={{ width: `${totalSets ? (completedSets / totalSets) * 100 : 0}%` }} /></div></div><StatusPill tone="green" dot>{t('common.online')}</StatusPill></div><AnimatePresence mode="wait">{phase === 'rest' ? <RestView key="rest" seconds={restSeconds} paused={restPaused} onPause={() => setRestPaused((value) => !value)} onSkip={() => { setRestSeconds(0); advanceFromRest() }} onAdd={() => setRestSeconds((value) => value + 15)} onReduce={() => setRestSeconds((value) => Math.max(0, value - 15))} onContinue={advanceFromRest} draft={draft} plan={currentPlan} onDraftChange={(patch) => setDraft((current) => ({ ...current, ...patch }))} t={t} /> : <motion.div key={`set-${exerciseIndex}-${setIndex}`} className="live-main" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} transition={{ duration: .22 }}><div className="live-current"><span className="live-kicker">{t('live.exercise')} {String(exerciseIndex + 1).padStart(2, '0')} · {t('live.set')} {setIndex + 1} / {currentPlan?.sets ?? 0}</span><div className="live-title-row"><h1>{currentExercise ? localizedName(currentExercise, language) : t('common.exercise')}</h1>{currentExercise && <IconButton label={t('live.viewExercise')} className="live-info-button" onClick={() => setExerciseInfoOpen(true)}><Info size={17} /></IconButton>}</div><p>{currentExercise?.description}</p><div className="live-planned"><div className="planned-item"><span>{t('live.planned')}</span><strong>{currentPlan?.targetWeight || 'BW'} {currentPlan?.targetWeight ? t('common.kg') : ''}</strong><small>{currentPlan?.targetReps ? ` × ${currentPlan.targetReps} ${t('common.reps')}` : ''}</small></div><ChevronRight className="planned-arrow" size={19} /><div className="planned-item"><span>{t('live.actual')}</span><strong>{draft.weight || '—'} {draft.weight ? t('common.kg') : ''}</strong><small>{draft.reps ? ` × ${draft.reps} ${t('common.reps')}` : ''}</small></div></div><div className="live-form"><Field label={t('live.weight')} type="number" min="0" step="0.5" value={draft.weight} onChange={(event) => setDraft((current) => ({ ...current, weight: event.target.value }))} placeholder={currentPlan?.targetWeight ? String(currentPlan.targetWeight) : '0'} /><Field label={t('live.reps')} type="number" min="0" value={draft.reps} onChange={(event) => setDraft((current) => ({ ...current, reps: event.target.value }))} placeholder={currentPlan?.targetReps ? String(currentPlan.targetReps) : '0'} /><Rating label={t('live.difficulty')} value={draft.difficulty} min={1} max={10} onChange={(value) => setDraft((current) => ({ ...current, difficulty: value }))} /><Rating label={t('live.feeling')} value={draft.feeling} min={1} max={5} onChange={(value) => setDraft((current) => ({ ...current, feeling: value }))} /><TextAreaField className="live-form-wide" label={t('live.notes')} value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} placeholder="" /><div className="live-form-actions"><NeonButton variant="ghost" size="sm" onClick={skipSet}><SkipForward size={13} />{t('live.skipSet')}</NeonButton><NeonButton className="live-complete-button" size="lg" onClick={completeSet}><Check size={17} />{t('live.completeSet')}</NeonButton></div></div></div><LiveSidebar day={selectedDay} exerciseIndex={exerciseIndex} sessions={liveSession} exercises={exercises} language={language} t={t} /></motion.div>}</AnimatePresence></div></section><ExerciseInfoModal exercise={currentExercise ?? null} language={language} open={exerciseInfoOpen} onClose={() => setExerciseInfoOpen(false)} /></PageMotion>
}

function Rating({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) { return <div className="rating-field"><span>{label}</span><div>{Array.from({ length: max - min + 1 }, (_, index) => { const option = min + index; return <button type="button" key={option} className={option === value ? 'rating-dot active' : 'rating-dot'} onClick={() => onChange(option)} aria-label={`${label} ${option}`}>{option}</button> })}</div></div> }

function LiveSidebar({ day, exerciseIndex, sessions, exercises, language, t }: { day?: WorkoutDay; exerciseIndex: number; sessions?: WorkoutSession; exercises: Array<{ id: string; name: string; nameEs: string }>; language: 'en' | 'es'; t: (key: string) => string }) { return <aside className="live-sidebar"><div className="live-sidebar-title"><span>{day?.name ?? t('live.choose')}</span><span>{sessions?.sets.length ?? 0} ✓</span></div><div className="live-exercise-list">{day?.exercises.slice().sort((a, b) => a.orderIndex - b.orderIndex).map((plan, index) => { const exercise = exercises.find((item) => item.id === plan.exerciseId); const completed = day ? getCompletedSetsForPlan(day, index, sessions?.sets ?? []) : 0; const done = completed >= plan.sets; return <div className={`live-exercise ${index === exerciseIndex ? 'current' : ''} ${done ? 'done' : ''}`} key={plan.id}><span className="live-exercise-num">{done ? <Check size={12} /> : String(index + 1).padStart(2, '0')}</span><strong>{exercise ? localizedName(exercise, language) : 'Exercise'}</strong><span>{completed}/{plan.sets}</span></div> })}</div></aside> }

function RestView({ seconds, paused, onPause, onSkip, onAdd, onReduce, onContinue, draft, plan, onDraftChange, t }: { seconds: number; paused: boolean; onPause: () => void; onSkip: () => void; onAdd: () => void; onReduce: () => void; onContinue: () => void; draft: LiveSetDraft; plan?: WorkoutExercise; onDraftChange: (patch: Partial<LiveSetDraft>) => void; t: (key: string) => string }) { return <motion.div className="rest-stage" initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><div className="live-kicker">{t('live.rest')}</div><div className="rest-timer"><strong>{formatTime(seconds)}</strong></div><h2>{t('live.rest')}</h2><p>{t('live.restReady')}</p><div className="rest-entry"><span>{t('live.actual')}</span><div><Field label={t('live.weight')} type="number" min="0" step="0.5" value={draft.weight} onChange={(event) => onDraftChange({ weight: event.target.value })} placeholder={plan?.targetWeight ? String(plan.targetWeight) : '0'} /><Field label={t('live.reps')} type="number" min="0" value={draft.reps} onChange={(event) => onDraftChange({ reps: event.target.value })} placeholder={plan?.targetReps ? String(plan.targetReps) : '0'} /></div></div><div className="rest-actions"><NeonButton variant="secondary" size="sm" onClick={onReduce}><Minus size={13} />{t('live.reduceTime')}</NeonButton><NeonButton variant="secondary" size="sm" onClick={onPause}>{paused ? <Play size={13} /> : <Pause size={13} />}{paused ? t('live.continue') : t('live.pause')}</NeonButton><NeonButton variant="secondary" size="sm" onClick={onAdd}><Plus size={13} />{t('live.addTime')}</NeonButton></div><div style={{ display: 'flex', gap: 9, marginTop: 18 }}><NeonButton variant="ghost" size="sm" onClick={onSkip}><SkipForward size={13} />{t('live.skipRest')}</NeonButton><NeonButton size="sm" onClick={onContinue}><ChevronRight size={14} />{t('live.continue')}</NeonButton></div></motion.div> }

function CompletionView({ session, profile, elapsedSeconds, feedback, setFeedback, onFinish, t }: { session?: WorkoutSession; profile: Profile; elapsedSeconds: number; feedback: { energy: number; fatigue: number; mood: number; overallFeeling: number; difficulty: number; notes: string }; setFeedback: (value: { energy: number; fatigue: number; mood: number; overallFeeling: number; difficulty: number; notes: string }) => void; onFinish: () => void; t: (key: string) => string }) { const [shareOpen, setShareOpen] = useState(false); const update = (patch: Partial<typeof feedback>) => setFeedback({ ...feedback, ...patch }); return <section className="live-page"><GlassCard className="live-completion"><span className="completion-icon"><Trophy size={29} /></span><span className="eyebrow-label">{t('live.workoutComplete')}</span><h2>{t('live.workoutComplete')}</h2><p>{t('live.review')}</p><div className="completion-stats"><div className="completion-stat"><span>{t('live.duration')}</span><strong>{Math.round((session?.durationSeconds || elapsedSeconds) / 60)} {t('common.min')}</strong></div><div className="completion-stat"><span>{t('live.totalVolume')}</span><strong>{formatNumber(session ? calculateSessionVolume(session) : 0)} {t('common.kg')}</strong></div><div className="completion-stat"><span>{t('live.totalReps')}</span><strong>{session?.sets.reduce((sum, set) => sum + set.actualReps, 0) ?? 0}</strong></div></div><div className="completion-form"><SectionHeading title={t('live.howWas')} /><div className="completion-rating"><span>{t('live.energy')}</span><RatingRow value={feedback.energy} onChange={(value) => update({ energy: value })} labels={[t('live.veryBad'), t('live.bad'), t('live.neutral'), t('live.good'), t('live.excellent')]} /></div><div className="completion-rating"><span>{t('live.mood')}</span><RatingRow value={feedback.mood} onChange={(value) => update({ mood: value })} labels={[t('live.veryBad'), t('live.bad'), t('live.neutral'), t('live.good'), t('live.excellent')]} /></div><TextAreaField label={t('live.notes')} value={feedback.notes} onChange={(event) => update({ notes: event.target.value })} /><div className="completion-share-actions"><button type="button" className="neon-button neon-button-secondary neon-button-lg" onClick={() => setShareOpen(true)}><Share2 size={15} />{t('share.button')}</button><NeonButton size="lg" style={{ flex: 1 }} onClick={onFinish}><Sparkles size={15} />{t('live.finish')}</NeonButton></div></div></GlassCard><ShareCardModal open={shareOpen} onClose={() => setShareOpen(false)} title={t('live.workoutComplete')} subtitle={t('live.review')} tag={t('quick.finishEyebrow')} profiles={[profile]} baseImageSrc="/share/workout-base.png" fileName="live-workout.png" stats={[{ label: t('live.duration'), value: `${Math.round((session?.durationSeconds || elapsedSeconds) / 60)} min` }, { label: t('live.totalVolume'), value: `${formatNumber(session ? calculateSessionVolume(session) : 0)} kg`, accent: '#6ee7f9' }, { label: t('live.totalReps'), value: formatNumber(session?.sets.reduce((sum, set) => sum + set.actualReps, 0) ?? 0), accent: '#ed7bea' }, { label: t('live.overall'), value: `${feedback.overallFeeling}/5`, accent: '#f5ad74' }]} /></section> }
function RatingRow({ value, onChange, labels }: { value: number; onChange: (value: number) => void; labels: string[] }) { return <div className="rating-row">{labels.map((label, index) => <button type="button" key={label} className={`rating-button ${value === index + 1 ? 'active' : ''}`} onClick={() => onChange(index + 1)}>{label}</button>)}</div> }

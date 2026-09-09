import { ArrowLeft, BarChart3, Dumbbell, Footprints, Trophy, UserRound } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Avatar, EmptyState, Field, GlassCard, NeonButton, SectionHeading, SelectField, TextAreaField } from '../components/ui'
import { PageMotion } from '../components/PageMotion'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToCoachingChanges } from '../lib/coaching-realtime'
import { createCoachNote, createCoachingStrategyDraft, getCoachNotes, getCoachingAthleteOverview, getCoachingAthleteStrategy, getCoachingStrategyVersions, getStrategyManagement, publishCoachingStrategyDraft, restoreCoachingStrategyVersion, saveCoachingWorkoutPlan, startCoachStrategyManagement, updateCoachingStrategyGoals } from '../lib/coaching-space'
import type { CoachNote, CoachingAthleteOverview, StrategyManagement, StrategyVersionSummary } from '../types'

export function CoachAthletePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { spaceId, athleteId } = useParams<{ spaceId: string; athleteId: string }>()
  const [athlete, setAthlete] = useState<CoachingAthleteOverview | null>(null)
  const [management, setManagement] = useState<StrategyManagement | null>(null)
  const [goals, setGoals] = useState({ stepGoal: 10000, calorieGoal: 2000, proteinGoal: 0, carbsGoal: 0, fatsGoal: 0, fiberGoal: 0 })
  const [workoutDays, setWorkoutDays] = useState<Record<string, unknown>[]>([])
  const [isManaging, setIsManaging] = useState(false)
  const [isSavingGoals, setIsSavingGoals] = useState(false)
  const [isCreatingDraft, setIsCreatingDraft] = useState(false)
  const [isSavingWorkout, setIsSavingWorkout] = useState(false)
  const [draftVersionId, setDraftVersionId] = useState('')
  const [isPublishingDraft, setIsPublishingDraft] = useState(false)
  const [realtimeTick, setRealtimeTick] = useState(0)
  const [notes, setNotes] = useState<CoachNote[]>([])
  const [versions, setVersions] = useState<StrategyVersionSummary[]>([])
  const [isRestoring, setIsRestoring] = useState(false)
  const [compareLeftId, setCompareLeftId] = useState('')
  const [compareRightId, setCompareRightId] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!spaceId || !athleteId) return
    let active = true
    void Promise.all([getCoachingAthleteOverview(spaceId, athleteId), getStrategyManagement(athleteId), getCoachingAthleteStrategy(spaceId, athleteId), getCoachNotes(spaceId, athleteId), getCoachingStrategyVersions(athleteId)]).then(([result, strategyManagement, strategyData, athleteNotes, strategyVersions]) => { if (active) { setAthlete(result); setManagement(strategyManagement); setNotes(athleteNotes); setVersions(strategyVersions); setWorkoutDays(Array.isArray(strategyData?.workoutDays) ? strategyData.workoutDays as Record<string, unknown>[] : []); setCompareLeftId(strategyVersions[1]?.id ?? strategyVersions[0]?.id ?? ''); setCompareRightId(strategyVersions[0]?.id ?? ''); const profile = strategyData?.profile as Record<string, unknown> | undefined; const nutrition = strategyData?.nutrition as Record<string, unknown> | null | undefined; setGoals({ stepGoal: Number(profile?.daily_step_goal ?? result?.dailyStepGoal ?? 10000), calorieGoal: Number(nutrition?.calories ?? result?.dailyCalorieGoal ?? 2000), proteinGoal: Number(nutrition?.protein ?? 0), carbsGoal: Number(nutrition?.carbs ?? 0), fatsGoal: Number(nutrition?.fats ?? 0), fiberGoal: Number(nutrition?.fiber ?? 0) }) } }).catch(() => { if (active) setError(t('coach.athleteLoadError')) }).finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [spaceId, athleteId, realtimeTick, t])

  useEffect(() => {
    if (!spaceId || !athleteId) return
    return subscribeToCoachingChanges(spaceId, athleteId, () => setRealtimeTick((current) => current + 1))
  }, [spaceId, athleteId])

  if (!user) return null
  if (isLoading) return <div className="app-loading"><span>{t('common.loading')}</span></div>
  const enableStrategyManagement = async () => {
    if (!spaceId || !athleteId || isManaging) return
    setIsManaging(true)
    try { await startCoachStrategyManagement(spaceId, athleteId); setManagement({ athleteUserId: athleteId, managerUserId: user.id, spaceId, relationshipId: null, managementMode: 'coach', status: 'active', startedAt: new Date().toISOString(), endedAt: null }) } catch { setError(t('coach.strategyManagementError')) } finally { setIsManaging(false) }
  }

  const saveGoals = async (event: FormEvent) => {
    event.preventDefault()
    if (!spaceId || !athleteId || management?.managementMode !== 'coach' || isSavingGoals) return
    setIsSavingGoals(true)
    try { await updateCoachingStrategyGoals(spaceId, athleteId, goals) } catch { setError(t('coach.strategySaveError')) } finally { setIsSavingGoals(false) }
  }

  const createDraft = async () => {
    if (!spaceId || !athleteId || management?.managementMode !== 'coach' || isCreatingDraft) return
    setIsCreatingDraft(true)
    try { setDraftVersionId(await createCoachingStrategyDraft(spaceId, athleteId, t('coach.firstDraftReason'))) } catch { setError(t('coach.strategyDraftError')) } finally { setIsCreatingDraft(false) }
  }

  const updateWorkoutDayDraft = (dayIndex: number, patch: Record<string, unknown>) => setWorkoutDays((current) => current.map((day, index) => index === dayIndex ? { ...day, ...patch } : day))
  const updateWorkoutExerciseDraft = (dayIndex: number, exerciseIndex: number, patch: Record<string, unknown>) => setWorkoutDays((current) => current.map((day, index) => { if (index !== dayIndex) return day; const exercises = Array.isArray(day.exercises) ? day.exercises as Record<string, unknown>[] : []; return { ...day, exercises: exercises.map((exercise, itemIndex) => itemIndex === exerciseIndex ? { ...exercise, ...patch } : exercise) } }))
  const removeWorkoutDayDraft = (dayIndex: number) => setWorkoutDays((current) => current.filter((_, index) => index !== dayIndex))
  const removeWorkoutExerciseDraft = (dayIndex: number, exerciseIndex: number) => setWorkoutDays((current) => current.map((day, index) => { if (index !== dayIndex) return day; const exercises = Array.isArray(day.exercises) ? day.exercises as Record<string, unknown>[] : []; return { ...day, exercises: exercises.filter((_, itemIndex) => itemIndex !== exerciseIndex) } }))
  const saveWorkoutPlan = async () => {
    if (!spaceId || !athleteId || management?.managementMode !== 'coach' || isSavingWorkout) return
    setIsSavingWorkout(true)
    try { const normalizedDays = workoutDays.map((day) => ({ name: String(day.name ?? ''), nameEs: String(day.name_es ?? day.name ?? ''), description: String(day.description ?? ''), weekday: Number(day.weekday ?? 1), estimatedMinutes: Number(day.estimated_minutes ?? 45), exercises: (Array.isArray(day.exercises) ? day.exercises as Record<string, unknown>[] : []).map((exercise) => ({ exerciseId: String(exercise.exercise_id ?? ''), sets: Number(exercise.sets ?? 3), targetReps: Number(exercise.target_reps ?? 0), targetSeconds: Number(exercise.target_seconds ?? 0), targetWeight: Number(exercise.target_weight ?? 0), restSeconds: Number(exercise.rest_seconds ?? 60), notes: String(exercise.notes ?? '') })) })); await saveCoachingWorkoutPlan(spaceId, athleteId, normalizedDays); setNotice(t('coach.workoutSaved')) } catch { setError(t('coach.workoutSaveError')) } finally { setIsSavingWorkout(false) }
  }

  const saveNote = async (event: FormEvent) => {
    event.preventDefault()
    if (!spaceId || !athleteId || !noteContent.trim() || isSavingNote) return
    setIsSavingNote(true)
    try { await createCoachNote(spaceId, athleteId, noteContent); setNoteContent(''); setNotes(await getCoachNotes(spaceId, athleteId)) } catch { setError(t('coach.noteSaveError')) } finally { setIsSavingNote(false) }
  }

  const publishDraft = async () => {
    if (!draftVersionId || isPublishingDraft) return
    setIsPublishingDraft(true)
    try { await publishCoachingStrategyDraft(draftVersionId); setDraftVersionId('') } catch { setError(t('coach.strategyPublishError')) } finally { setIsPublishingDraft(false) }
  }

  const restoreVersion = async (version: StrategyVersionSummary) => {
    if (isRestoring) return
    setIsRestoring(true)
    try { const draftId = await restoreCoachingStrategyVersion(version.id, t('coach.restoreReason')); setVersions((current) => [{ id: draftId, versionNumber: null, status: 'draft', name: t('coach.restoredDraft'), changeReason: t('coach.restoreReason'), createdBy: user.id, createdAt: new Date().toISOString(), publishedAt: null }, ...current]) } catch { setError(t('coach.strategyRestoreError')) } finally { setIsRestoring(false) }
  }

  if (error || !athlete) return <PageMotion><EmptyState icon={<UserRound size={20} />} title={t('coach.athleteNotFound')} description={error || t('coach.athleteNotAuthorized')} action={<button type="button" onClick={() => navigate('/app/coach')}>{t('common.back')}</button>} /></PageMotion>

  return <PageMotion>{notice && <div className="inline-success" role="status">{notice}</div>}<div className="coach-athlete-page"><Link className="coach-back-link" to="/app/coach"><ArrowLeft size={14} />{t('common.back')}</Link><div className="coach-athlete-hero"><Avatar src={athlete.avatarUrl} name={athlete.displayName} size="lg" /><div><span className="eyebrow-label">{t('coach.athleteOverview')}</span><h1>{athlete.displayName}</h1><p>@{athlete.publicHandle} · {athlete.publicCode}</p></div></div><GlassCard className="coach-management-banner"><div><span className="eyebrow-label">{t('coach.strategyManagement')}</span><strong>{management?.managementMode === 'coach' ? t('coach.managedByYou') : t('coach.selfManaged')}</strong><p>{management?.managementMode === 'coach' ? t('coach.managementActive') : t('coach.managementHint')}</p></div>{management?.managementMode !== 'coach' && <NeonButton size="sm" onClick={() => { void enableStrategyManagement() }} loading={isManaging}>{t('coach.manageStrategy')}</NeonButton>}</GlassCard><GlassCard className="coach-goals-editor"><SectionHeading eyebrow={t('coach.strategySummary')} title={t('coach.prescription')} description={t('coach.strategyEditorHint')} />{management?.managementMode === 'coach' ? <form className="coach-goals-form" onSubmit={saveGoals}><Field label={t('strategy.steps')} type="number" min="0" value={goals.stepGoal} onChange={(event) => setGoals((current) => ({ ...current, stepGoal: Number(event.target.value) || 0 }))} /><Field label={t('strategy.calories')} type="number" min="1" value={goals.calorieGoal} onChange={(event) => setGoals((current) => ({ ...current, calorieGoal: Number(event.target.value) || 0 }))} /><Field label={t('strategy.protein')} type="number" min="0" value={goals.proteinGoal} onChange={(event) => setGoals((current) => ({ ...current, proteinGoal: Number(event.target.value) || 0 }))} /><Field label={t('strategy.carbs')} type="number" min="0" value={goals.carbsGoal} onChange={(event) => setGoals((current) => ({ ...current, carbsGoal: Number(event.target.value) || 0 }))} /><Field label={t('strategy.fats')} type="number" min="0" value={goals.fatsGoal} onChange={(event) => setGoals((current) => ({ ...current, fatsGoal: Number(event.target.value) || 0 }))} /><Field label={t('strategy.fiber')} type="number" min="0" value={goals.fiberGoal} onChange={(event) => setGoals((current) => ({ ...current, fiberGoal: Number(event.target.value) || 0 }))} /><NeonButton type="submit" loading={isSavingGoals}>{t('common.save')}</NeonButton><NeonButton type="button" variant="secondary" onClick={() => { void createDraft() }} loading={isCreatingDraft}>{t('coach.createDraft')}</NeonButton>{draftVersionId && <NeonButton type="button" onClick={() => { void publishDraft() }} loading={isPublishingDraft}>{t('coach.publishDraft')}</NeonButton>}</form> : <p className="coach-management-copy">{t('coach.enableManagementToEdit')}</p>}</GlassCard><GlassCard className="coach-workout-editor"><SectionHeading eyebrow={t('coach.workoutEditorEyebrow')} title={t('coach.workoutEditorTitle')} description={t('coach.workoutEditorHint')} /><div className="coach-workout-days">{workoutDays.map((day, dayIndex) => <div className="coach-workout-day" key={`${String(day.id ?? dayIndex)}-${dayIndex}`}><div className="coach-workout-day-header"><Field label={t('strategy.dayName')} value={String(day.name ?? '')} onChange={(event) => updateWorkoutDayDraft(dayIndex, { name: event.target.value, name_es: event.target.value })} /><Field label={t('coach.weekday')} type="number" min="1" max="7" value={Number(day.weekday ?? 1)} onChange={(event) => updateWorkoutDayDraft(dayIndex, { weekday: Number(event.target.value) || 1 })} /><NeonButton type="button" variant="danger" size="sm" onClick={() => removeWorkoutDayDraft(dayIndex)}>{t('coach.removeDay')}</NeonButton></div><div className="coach-workout-exercises">{(Array.isArray(day.exercises) ? day.exercises as Record<string, unknown>[] : []).map((exercise, exerciseIndex) => <div className="coach-workout-exercise" key={`${String(exercise.id ?? exercise.exercise_id ?? exerciseIndex)}-${exerciseIndex}`}><Field label={t('coach.exerciseId')} value={String(exercise.exercise_id ?? '')} onChange={(event) => updateWorkoutExerciseDraft(dayIndex, exerciseIndex, { exercise_id: event.target.value })} /><Field label={t('common.sets')} type="number" min="1" value={Number(exercise.sets ?? 3)} onChange={(event) => updateWorkoutExerciseDraft(dayIndex, exerciseIndex, { sets: Number(event.target.value) || 1 })} /><Field label={t('common.reps')} type="number" min="0" value={Number(exercise.target_reps ?? 0)} onChange={(event) => updateWorkoutExerciseDraft(dayIndex, exerciseIndex, { target_reps: Number(event.target.value) || 0 })} /><Field label={t('common.kg')} type="number" min="0" step="0.5" value={Number(exercise.target_weight ?? 0)} onChange={(event) => updateWorkoutExerciseDraft(dayIndex, exerciseIndex, { target_weight: Number(event.target.value) || 0 })} /><NeonButton type="button" variant="ghost" size="sm" onClick={() => removeWorkoutExerciseDraft(dayIndex, exerciseIndex)}>{t('common.remove')}</NeonButton></div>)}</div></div>)}</div><NeonButton type="button" loading={isSavingWorkout} onClick={() => { void saveWorkoutPlan() }}>{t('coach.saveWorkoutPlan')}</NeonButton></GlassCard><GlassCard className="coach-versions-card"><SectionHeading eyebrow={t('coach.versionsEyebrow')} title={t('coach.versionsTitle')} description={t('coach.versionsHint')} /><div className="coach-version-list">{versions.length ? versions.map((version) => <div className="coach-version-row" key={version.id}><div><strong>v{version.versionNumber ?? '—'} · {version.status}</strong><span>{version.name} · {version.changeReason || t('coach.noReason')}</span></div>{version.status !== 'draft' && <NeonButton size="sm" variant="secondary" onClick={() => { void restoreVersion(version) }} loading={isRestoring}>{t('coach.restore')}</NeonButton>}</div>) : <p className="coach-empty-copy">{t('coach.noVersions')}</p>}</div></GlassCard>{versions.length > 1 && <GlassCard className="coach-compare-card"><SectionHeading eyebrow={t('coach.compareEyebrow')} title={t('coach.compareTitle')} description={t('coach.compareHint')} /><div className="coach-compare-selectors"><SelectField label={t('coach.compareFrom')} value={compareLeftId} onChange={(event) => setCompareLeftId(event.target.value)}>{versions.map((version) => <option value={version.id} key={version.id}>v{version.versionNumber ?? '—'} · {version.name}</option>)}</SelectField><SelectField label={t('coach.compareTo')} value={compareRightId} onChange={(event) => setCompareRightId(event.target.value)}>{versions.map((version) => <option value={version.id} key={version.id}>v{version.versionNumber ?? '—'} · {version.name}</option>)}</SelectField></div><VersionCompare left={versions.find((version) => version.id === compareLeftId) ?? versions[0]} right={versions.find((version) => version.id === compareRightId) ?? versions[0]} t={t} /></GlassCard>}<div className="coach-athlete-metrics"><Metric icon={<Dumbbell size={16} />} value={athlete.workoutsLast7Days} label={t('coach.workoutsWeek')} /><Metric icon={<BarChart3 size={16} />} value={Math.round(athlete.volumeLast7Days).toLocaleString()} label={t('coach.volumeWeek')} /><Metric icon={<Footprints size={16} />} value={athlete.latestSteps?.toLocaleString() ?? '—'} label={t('coach.latestSteps')} /><Metric icon={<Trophy size={16} />} value={athlete.personalRecordsCount} label={t('coach.records')} /></div><div className="coach-athlete-grid"><GlassCard><SectionHeading eyebrow={t('coach.activitySummary')} title={t('coach.recentActivity')} /><div className="coach-detail-list"><div><span>{t('strategy.steps')}</span><strong>{athlete.dailyStepGoal.toLocaleString()}</strong></div><div><span>{t('strategy.calories')}</span><strong>{athlete.dailyCalorieGoal} kcal</strong></div><div><span>{t('profile.weight')}</span><strong>{athlete.latestBodyWeight ?? athlete.weightKg} kg</strong></div></div></GlassCard><GlassCard><SectionHeading eyebrow={t('coach.activitySummary')} title={t('coach.recentActivity')} /><div className="coach-detail-list"><div><span>{t('coach.lastWorkout')}</span><strong>{athlete.lastWorkoutAt ? new Date(athlete.lastWorkoutAt).toLocaleDateString() : '—'}</strong></div><div><span>{t('coach.relationship')}</span><strong>{t('coach.activeRelationship')}</strong></div><div><span>{t('coach.started')}</span><strong>{athlete.relationshipStartedAt ? new Date(athlete.relationshipStartedAt).toLocaleDateString() : '—'}</strong></div></div></GlassCard></div><GlassCard className="coach-notes-card"><SectionHeading eyebrow={t('coach.notesEyebrow')} title={t('coach.notesTitle')} description={t('coach.notesHint')} /><form className="coach-note-form" onSubmit={saveNote}><TextAreaField label={t('coach.noteLabel')} value={noteContent} onChange={(event) => setNoteContent(event.target.value)} placeholder={t('coach.notePlaceholder')} rows={3} /><NeonButton type="submit" loading={isSavingNote} disabled={!noteContent.trim()}>{t('coach.saveNote')}</NeonButton></form><div className="coach-note-list">{notes.map((note) => <article className="coach-note" key={note.id}><p>{note.content}</p><time>{new Date(note.createdAt).toLocaleString()}</time></article>)}</div></GlassCard></div></PageMotion>
}

function VersionCompare({ left, right, t }: { left: StrategyVersionSummary; right: StrategyVersionSummary; t: (key: string) => string }) {
  const snapshot = (version: StrategyVersionSummary) => version.snapshot && typeof version.snapshot === 'object' && !Array.isArray(version.snapshot) ? version.snapshot as Record<string, unknown> : {}
  const nutrition = (version: StrategyVersionSummary) => { const data = snapshot(version).nutrition; return data && typeof data === 'object' && !Array.isArray(data) ? data as Record<string, unknown> : {} }
  const days = (version: StrategyVersionSummary) => { const data = snapshot(version).workoutDays; return Array.isArray(data) ? data : [] }
  const values = [['ai.fields.calories', nutrition(left).calories, nutrition(right).calories], ['ai.fields.protein', nutrition(left).protein, nutrition(right).protein], ['ai.fields.carbs', nutrition(left).carbs, nutrition(right).carbs], ['ai.fields.fat', nutrition(left).fats, nutrition(right).fats], [t('strategy.steps'), (snapshot(left).profile as Record<string, unknown> | undefined)?.daily_step_goal, (snapshot(right).profile as Record<string, unknown> | undefined)?.daily_step_goal]]
  return <div className="coach-compare-list">{values.map(([label, leftValue, rightValue]) => <div key={String(label)}><span>{String(label).startsWith('ai.') ? t(String(label)) : String(label)}</span><strong>{String(leftValue ?? '—')}</strong><strong>{String(rightValue ?? '—')}</strong></div>)}<div><span>{t('strategy.trainingPlan')}</span><strong>{days(left).length}</strong><strong>{days(right).length}</strong></div></div>
}

function Metric({ icon, value, label }: { icon: ReactNode; value: string | number; label: string }) { return <div className="coach-athlete-metric"><span className="coach-space-icon">{icon}</span><strong>{value}</strong><span>{label}</span></div> }

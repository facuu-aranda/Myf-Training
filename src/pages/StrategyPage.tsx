import { Dumbbell, GripVertical, MoreHorizontal, Pencil, Plus, Target, Trash2, Utensils } from 'lucide-react'
import { useEffect, useMemo, useState, type DragEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { PageMotion } from '../components/PageMotion'
import { ExerciseInfoModal } from '../components/ExerciseInfoModal'
import { ExercisePicker } from '../components/ExercisePicker'
import { GlassCard, IconButton, Modal, NeonButton, SectionHeading, SelectField, Field, TextAreaField, StatusPill, EmptyState } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useFitness } from '../hooks/useFitness'
import { localizedName } from '../lib/utils'
import type { Exercise, NutritionPlan, WorkoutDay, WorkoutExercise } from '../types'

export function StrategyPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { profiles, nutritionPlans, exercises, workoutDays, updateProfile, updateNutrition, addWorkoutDay, updateWorkoutDay, removeWorkoutDay, reorderWorkoutDays, addExerciseToDay, updateWorkoutExercise, removeExerciseFromDay } = useFitness()
  const [selectedDayId, setSelectedDayId] = useState('')
  const [nutritionOpen, setNutritionOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [dayEditor, setDayEditor] = useState<WorkoutDay | null>(null)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [pickerSearch, setPickerSearch] = useState('')
  const [draggedDay, setDraggedDay] = useState<string | null>(null)
  const userDays = useMemo(() => workoutDays.filter((day) => day.userId === user?.id).sort((a, b) => a.orderIndex - b.orderIndex), [user?.id, workoutDays])
  const selectedDay = userDays.find((day) => day.id === selectedDayId) ?? userDays[0]
  const nutrition = nutritionPlans.find((plan) => plan.userId === user?.id)
  const profile = profiles.find((item) => item.id === user?.id)

  useEffect(() => {
    if (selectedDay && selectedDay.id !== selectedDayId) setSelectedDayId(selectedDay.id)
  }, [selectedDay, selectedDayId])

  if (!user || !nutrition || !profile) return null
  const language = i18n.language.startsWith('es') ? 'es' : 'en'
  const onDayDrop = (event: DragEvent<HTMLButtonElement>, targetId: string) => {
    event.preventDefault()
    if (draggedDay && draggedDay !== targetId) {
      const ids = userDays.map((day) => day.id)
      const from = ids.indexOf(draggedDay)
      const to = ids.indexOf(targetId)
      ids.splice(from, 1)
      ids.splice(to, 0, draggedDay)
      reorderWorkoutDays(user.id, ids)
    }
    setDraggedDay(null)
  }
  const chooseExercise = (exercise: Exercise) => {
    if (selectedDay) addExerciseToDay(selectedDay.id, exercise.id)
    setPickerOpen(false)
    setPickerSearch('')
  }

  return <PageMotion>
    <div className="page-header"><div><span className="eyebrow-label">{t('nav.strategy')}</span><h1>{t('strategy.title')}</h1><p>{t('strategy.subtitle')}</p></div><NeonButton variant="secondary" size="sm" onClick={() => addWorkoutDay(user.id)}><Plus size={14} />{t('strategy.addDay')}</NeonButton></div>
    <div className="strategy-top"><GlassCard className="nutrition-card"><div className="nutrition-head"><div><span className="eyebrow-label">{t('strategy.nutrition')}</span><h2>{nutrition.calories} kcal / day</h2><p>{nutrition.notes}</p></div><IconButton label={t('strategy.editNutrition')} onClick={() => setNutritionOpen(true)}><Pencil size={15} /></IconButton></div><div className="nutrition-grid"><NutritionStat label={t('strategy.calories')} value={nutrition.calories} unit="kcal" /><NutritionStat label={t('strategy.protein')} value={nutrition.protein} unit="g" /><NutritionStat label={t('strategy.carbs')} value={nutrition.carbs} unit="g" /><NutritionStat label={t('strategy.fats')} value={nutrition.fats} unit="g" /></div></GlassCard><GlassCard className="activity-targets"><SectionHeading eyebrow={t('strategy.activity')} title={t('strategy.activity')} /><div className="target-list"><TargetRow icon={<Target size={14} />} label={t('strategy.steps')} value={profile.dailyStepGoal} unit="steps" progress={profile.dailyStepGoal / 12000 * 100} /><TargetRow icon={<Utensils size={14} />} label={t('strategy.calories')} value={profile.dailyCalorieGoal} unit="kcal" progress={profile.dailyCalorieGoal / 2500 * 100} /><TargetRow icon={<Dumbbell size={14} />} label={t('strategy.workouts')} value={userDays.length} unit={t('common.week')} progress={userDays.length / 7 * 100} /></div></GlassCard></div>
    <section className="training-plan"><SectionHeading eyebrow={t('strategy.schedule')} title={t('strategy.trainingPlan')} description={t('strategy.trainingPlanSubtitle')} action={<StatusPill tone="violet" dot>{userDays.length} {t('common.exercises')}</StatusPill>} /><div className="day-tabs">{userDays.map((day) => <button type="button" draggable onDragStart={() => setDraggedDay(day.id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => onDayDrop(event, day.id)} className={`day-tab ${day.id === selectedDay?.id ? 'day-tab-active' : ''}`} key={day.id} onClick={() => setSelectedDayId(day.id)}><GripVertical size={12} style={{ float: 'right', color: '#6f647d' }} /><strong>{t(`days.${weekdayKey(day.weekday)}`)}</strong><span>{localizedName(day, language)} · {day.exercises.length} {t('common.exercises')}</span></button>)}</div>{selectedDay && <GlassCard className="plan-card"><div className="plan-header"><div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><h2>{localizedName(selectedDay, language)}</h2><IconButton label={t('strategy.renameDay')} onClick={() => setDayEditor(selectedDay)}><Pencil size={13} /></IconButton></div><p>{selectedDay.description} · {selectedDay.estimatedMinutes} {t('common.min')}</p></div><div style={{ display: 'flex', gap: 8 }}><NeonButton variant="secondary" size="sm" onClick={() => setDayEditor(selectedDay)}><Pencil size={13} />{t('common.edit')}</NeonButton><NeonButton size="sm" onClick={() => setPickerOpen(true)}><Plus size={14} />{t('strategy.addExercise')}</NeonButton></div></div><div className="plan-list">{selectedDay.exercises.length ? selectedDay.exercises.slice().sort((a, b) => a.orderIndex - b.orderIndex).map((plan, index) => { const exercise = exercises.find((item) => item.id === plan.exerciseId); return <PlanRow key={plan.id} plan={plan} exercise={exercise} index={index} language={language} onOpen={() => exercise && setSelectedExercise(exercise)} onChange={(patch) => updateWorkoutExercise(plan.id, patch)} onRemove={() => removeExerciseFromDay(plan.id)} t={t} /> }) : <EmptyState icon={<Dumbbell size={19} />} title={t('strategy.noExercises')} description={t('strategy.emptyDay')} action={<NeonButton size="sm" onClick={() => setPickerOpen(true)}><Plus size={13} />{t('strategy.addExercise')}</NeonButton>} />}</div></GlassCard>}</section>
    <Modal open={nutritionOpen} onClose={() => setNutritionOpen(false)} title={t('strategy.editNutrition')}><NutritionForm nutrition={nutrition} onSave={(patch) => { updateNutrition(user.id, patch); if (patch.calories) updateProfile(user.id, { dailyCalorieGoal: patch.calories }); setNutritionOpen(false) }} t={t} /></Modal>
    <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title={t('strategy.chooseExercise')} size="lg"><ExercisePicker exercises={exercises} language={language} search={pickerSearch} onSearch={setPickerSearch} onSelect={chooseExercise} /></Modal>
    <Modal open={Boolean(dayEditor)} onClose={() => setDayEditor(null)} title={t('strategy.renameDay')}><DayForm day={dayEditor} onSave={(patch) => { if (dayEditor) updateWorkoutDay(dayEditor.id, patch); setDayEditor(null) }} onDelete={() => { if (dayEditor) removeWorkoutDay(dayEditor.id); setDayEditor(null); setSelectedDayId('') }} t={t} /></Modal>
    <ExerciseInfoModal exercise={selectedExercise} language={language} open={Boolean(selectedExercise)} onClose={() => setSelectedExercise(null)} />
  </PageMotion>
}

function NutritionStat({ label, value, unit }: { label: string; value: number; unit: string }) { return <div className="nutrition-stat"><span>{label}</span><strong>{value}<small> {unit}</small></strong></div> }
function TargetRow({ icon, label, value, unit, progress }: { icon: ReactNode; label: string; value: number; unit: string; progress: number }) { return <div className="target-row"><span className="target-icon">{icon}</span><div className="target-copy"><span>{label}</span><div className="progress-track"><span style={{ width: `${Math.min(100, progress)}%` }} /></div></div><strong>{value.toLocaleString()}<small> {unit}</small></strong></div> }
function weekdayKey(day: number) { return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][Math.max(0, Math.min(6, day - 1))] }

function PlanRow({ plan, exercise, index, language, onOpen, onChange, onRemove, t }: { plan: WorkoutExercise; exercise?: Exercise; index: number; language: 'en' | 'es'; onOpen: () => void; onChange: (patch: Partial<WorkoutExercise>) => void; onRemove: () => void; t: (key: string) => string }) {
  return <div className="plan-row"><span className="plan-number">{String(index + 1).padStart(2, '0')}</span><button type="button" className="plan-copy" onClick={onOpen} style={{ border: 0, background: 'transparent', textAlign: 'left', padding: 0 }}><strong>{exercise ? localizedName(exercise, language) : t('common.exercise')}</strong><span>{exercise?.muscleGroup} · {exercise?.equipment}</span></button><span className="plan-tag">{plan.sets} {t('common.sets')} × {plan.targetReps || t('common.seconds')} {plan.targetReps ? t('common.reps') : ''}</span><span className="plan-tag">{plan.targetWeight ? `${plan.targetWeight} ${t('common.kg')}` : t('common.bodyWeight')} · {plan.restSeconds}s</span><div className="plan-row-actions"><IconButton label={t('common.remove')} onClick={onRemove}><Trash2 size={14} /></IconButton><IconButton label={t('common.edit')} onClick={() => onChange({ targetWeight: plan.targetWeight + 2.5 })}><MoreHorizontal size={15} /></IconButton></div><div className="inline-edit-grid"><Field aria-label={t('common.sets')} type="number" min="1" value={plan.sets} onChange={(event) => onChange({ sets: Number(event.target.value) || 1 })} /><Field aria-label={t('common.reps')} type="number" min="0" value={plan.targetReps} onChange={(event) => onChange({ targetReps: Number(event.target.value) || 0 })} /><Field aria-label={t('common.kg')} type="number" min="0" step="0.5" value={plan.targetWeight} onChange={(event) => onChange({ targetWeight: Number(event.target.value) || 0 })} /><Field aria-label={t('strategy.rest')} type="number" min="0" value={plan.restSeconds} onChange={(event) => onChange({ restSeconds: Number(event.target.value) || 0 })} /></div></div>
}

function NutritionForm({ nutrition, onSave, t }: { nutrition: NutritionPlan; onSave: (patch: Partial<NutritionPlan>) => void; t: (key: string) => string }) {
  const [form, setForm] = useState({ calories: nutrition.calories, protein: nutrition.protein, carbs: nutrition.carbs, fats: nutrition.fats, fiber: nutrition.fiber, notes: nutrition.notes })
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: key === 'notes' ? value : Number(value) || 0 }))
  return <form onSubmit={(event) => { event.preventDefault(); onSave(form) }} className="settings-form"><div className="settings-grid"><Field label={t('strategy.calories')} type="number" value={form.calories} onChange={(event) => set('calories', event.target.value)} /><Field label={t('strategy.protein')} type="number" value={form.protein} onChange={(event) => set('protein', event.target.value)} /><Field label={t('strategy.carbs')} type="number" value={form.carbs} onChange={(event) => set('carbs', event.target.value)} /><Field label={t('strategy.fats')} type="number" value={form.fats} onChange={(event) => set('fats', event.target.value)} /><Field label={t('strategy.fiber')} type="number" value={form.fiber} onChange={(event) => set('fiber', event.target.value)} /></div><TextAreaField label={t('strategy.notes')} value={form.notes} onChange={(event) => set('notes', event.target.value)} /><div className="modal-actions"><NeonButton type="button" variant="ghost" onClick={() => onSave({})}>{t('common.cancel')}</NeonButton><NeonButton type="submit">{t('common.save')}</NeonButton></div></form>
}

function DayForm({ day, onSave, onDelete, t }: { day: WorkoutDay | null; onSave: (patch: Partial<WorkoutDay>) => void; onDelete: () => void; t: (key: string) => string }) {
  const [name, setName] = useState(day?.name ?? '')
  const [nameEs, setNameEs] = useState(day?.nameEs ?? '')
  const [description, setDescription] = useState(day?.description ?? '')
  const [weekday, setWeekday] = useState(day?.weekday ?? 1)
  if (!day) return null
  return <form onSubmit={(event) => { event.preventDefault(); onSave({ name, nameEs: nameEs || name, description, weekday }) }}><div className="settings-form"><div className="settings-grid"><Field label={`${t('strategy.dayName')} · EN`} value={name} onChange={(event) => setName(event.target.value)} required /><Field label={`${t('strategy.dayName')} · ES`} value={nameEs} onChange={(event) => setNameEs(event.target.value)} /><SelectField label={t('strategy.dayName')} value={weekday} onChange={(event) => setWeekday(Number(event.target.value))}>{Array.from({ length: 7 }, (_, index) => <option key={index + 1} value={index + 1}>{t(`days.${weekdayKey(index + 1)}`)}</option>)}</SelectField></div><TextAreaField label={t('strategy.description')} value={description} onChange={(event) => setDescription(event.target.value)} /><div className="modal-actions"><NeonButton type="button" variant="danger" onClick={onDelete}><Trash2 size={14} />{t('strategy.removeDay')}</NeonButton><span style={{ flex: 1 }} /><NeonButton type="submit">{t('common.save')}</NeonButton></div></div></form>
}

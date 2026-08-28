import { ArrowUpRight, Dumbbell, Plus, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { PageMotion } from '../components/PageMotion'
import { GlassCard, Modal, NeonButton, SearchField, SelectField, SectionHeading, StatusPill } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useFitness } from '../hooks/useFitness'
import { localizedName } from '../lib/utils'
import type { Exercise } from '../types'

export function ExerciseLibraryPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { exercises, workoutDays, addExerciseToDay } = useFitness()
  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState('all')
  const [equipment, setEquipment] = useState('all')
  const [selected, setSelected] = useState<Exercise | null>(null)
  const [added, setAdded] = useState<string | null>(null)
  const language = i18n.language.startsWith('es') ? 'es' : 'en'
  const muscles = [...new Set(exercises.map((exercise) => exercise.muscleGroup))].sort()
  const equipmentOptions = [...new Set(exercises.map((exercise) => exercise.equipment))].sort()
  const userId = user?.id ?? ''
  const filtered = useMemo(() => exercises.filter((exercise) => { const text = `${exercise.name} ${exercise.nameEs} ${exercise.target} ${exercise.muscleGroup}`.toLowerCase(); return text.includes(search.toLowerCase()) && (muscle === 'all' || exercise.muscleGroup === muscle) && (equipment === 'all' || exercise.equipment === equipment) }), [equipment, exercises, muscle, search])
  if (!user) return null
  const userDays = workoutDays.filter((day) => day.userId === userId && day.active).sort((a, b) => a.orderIndex - b.orderIndex)
  const addToPlan = (exercise: Exercise) => { if (userDays[0]) { addExerciseToDay(userDays[0].id, exercise.id); setAdded(exercise.id); window.setTimeout(() => setAdded(null), 1800) } }
  return <PageMotion><div className="page-header"><div><span className="eyebrow-label">{t('nav.exercises')}</span><h1>{t('exercises.title')}</h1><p>{t('exercises.subtitle')}</p></div><StatusPill tone="violet"><Dumbbell size={12} />{exercises.length} {t('common.exercises')}</StatusPill></div><div className="library-toolbar"><SearchField value={search} onChange={setSearch} placeholder={t('exercises.searchPlaceholder')} /><SelectField className="filter-select" aria-label={t('exercises.muscle')} value={muscle} onChange={(event) => setMuscle(event.target.value)}><option value="all">{t('exercises.allMuscles')}</option>{muscles.map((item) => <option key={item} value={item}>{item}</option>)}</SelectField><SelectField className="filter-select" aria-label={t('exercises.equipment')} value={equipment} onChange={(event) => setEquipment(event.target.value)}><option value="all">{t('exercises.allEquipment')}</option>{equipmentOptions.map((item) => <option key={item} value={item}>{item}</option>)}</SelectField></div><div className="library-result-line"><span>{filtered.length} {t('exercises.title').toLowerCase()}</span>{(search || muscle !== 'all' || equipment !== 'all') && <button type="button" onClick={() => { setSearch(''); setMuscle('all'); setEquipment('all') }}><X size={12} />{t('common.clear')}</button>}</div><div className="exercise-grid">{filtered.map((exercise, index) => <motion.div key={exercise.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * .02, .3) }}><GlassCard className="exercise-card" hover onClick={() => setSelected(exercise)}><div className="exercise-image"><span className="exercise-equipment">{exercise.equipment}</span>{exercise.gifUrl && <img src={exercise.gifUrl} alt={localizedName(exercise, language)} loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none' }} />}</div><div className="exercise-card-body"><h3>{localizedName(exercise, language)}</h3><p>{exercise.muscleGroup} · {exercise.target}</p></div></GlassCard></motion.div>)}</div>{!filtered.length && <GlassCard><div className="empty-state"><span className="empty-icon"><Search size={18} /></span><h3>{t('common.noData')}</h3><p>{t('exercises.subtitle')}</p></div></GlassCard>}<Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={t('exercises.details')} size="lg">{selected && <ExerciseModal exercise={selected} language={language} onAdd={() => addToPlan(selected)} wasAdded={added === selected.id} t={t} />}</Modal></PageMotion>
}

function ExerciseModal({ exercise, language, onAdd, wasAdded, t }: { exercise: Exercise; language: 'en' | 'es'; onAdd: () => void; wasAdded: boolean; t: (key: string) => string }) { const instructions = language === 'es' ? exercise.instructionsEs : exercise.instructions; return <div className="exercise-modal-grid"><div><div className="exercise-modal-media">{exercise.gifUrl && <img src={exercise.gifUrl} alt={localizedName(exercise, language)} />}</div><a className="source-link" href={exercise.sourceUrl} target="_blank" rel="noreferrer">{t('exercises.source')} <ArrowUpRight size={12} /></a></div><div className="exercise-modal-copy"><h3>{localizedName(exercise, language)}</h3><p>{exercise.description}</p><div className="exercise-meta"><span>{exercise.category}</span><span>{exercise.muscleGroup}</span><span>{exercise.equipment}</span></div><SectionHeading title={t('exercises.instructions')} /><ol className="instruction-list">{instructions.map((instruction, index) => <li key={instruction}><i>{index + 1}</i>{instruction}</li>)}</ol><div className="modal-actions"><NeonButton size="sm" onClick={onAdd}>{wasAdded ? '✓ ' + t('exercises.added') : <><Plus size={13} />{t('exercises.addToPlan')}</>}</NeonButton></div></div></div> }

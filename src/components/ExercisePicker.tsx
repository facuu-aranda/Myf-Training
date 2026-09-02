import { ChevronDown, ChevronRight, Dumbbell, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { localizedName } from '../lib/utils'
import type { Exercise } from '../types'
import { StatusPill } from './ui'

interface ExercisePickerProps {
  exercises: Exercise[]
  language: 'en' | 'es'
  search: string
  onSearch: (value: string) => void
  onSelect: (exercise: Exercise) => void
}

export function ExercisePicker({ exercises, language, search, onSearch, onSelect }: ExercisePickerProps) {
  const { t } = useTranslation()
  const filteredExercises = useMemo(() => exercises.filter((exercise) => `${exercise.name} ${exercise.nameEs} ${exercise.target} ${exercise.muscleGroup} ${exercise.equipment}`.toLowerCase().includes(search.toLowerCase())), [exercises, search])
  const firstGroup = filteredExercises[0]?.muscleGroup || 'Other'
  const [openGroups, setOpenGroups] = useState<string[]>([firstGroup])
  const grouped = useMemo(() => {
    const result = new Map<string, Exercise[]>()
    filteredExercises.forEach((exercise) => {
      const key = exercise.muscleGroup || 'Other'
      const list = result.get(key) ?? []
      list.push(exercise)
      result.set(key, list)
    })
    return [...result.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [filteredExercises])
  const toggleGroup = (group: string) => setOpenGroups((current) => current.includes(group) ? current.filter((item) => item !== group) : [...current, group])
  return <div className="exercise-picker"><label className="exercise-picker-search"><Search size={16} /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder={t('exercises.searchPlaceholder')} autoFocus /><StatusPill tone="muted">{filteredExercises.length} {t('common.exercises')}</StatusPill></label><div className="exercise-picker-groups">{grouped.map(([group, items]) => { const isOpen = search.length > 0 || openGroups.includes(group); return <section className="exercise-picker-group" key={group}><button type="button" className="exercise-picker-group-header" aria-expanded={isOpen} onClick={() => toggleGroup(group)}><span className="exercise-group-icon"><Dumbbell size={14} /></span><span><strong>{group}</strong><small>{items.length} {t('common.exercises')}</small></span>{isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>{isOpen && <div className="exercise-picker-grid">{items.map((exercise) => <button type="button" className="exercise-picker-card" key={exercise.id} onClick={() => onSelect(exercise)}><span className="exercise-picker-media">{(exercise.imageUrl ?? exercise.gifUrl) ? <img src={exercise.imageUrl ?? exercise.gifUrl} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none' }} /> : <Dumbbell size={25} />}</span><span className="exercise-picker-copy"><strong>{localizedName(exercise, language)}</strong><small>{exercise.target} · {exercise.equipment}</small></span><span className="exercise-picker-add"><Plus size={14} /></span></button>)}</div>}</section> })}</div></div>
}

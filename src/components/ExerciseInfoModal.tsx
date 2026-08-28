import { ArrowUpRight, Dumbbell, Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { localizedName } from '../lib/utils'
import type { Exercise } from '../types'
import { Modal, SectionHeading } from './ui'

interface ExerciseInfoModalProps {
  exercise: Exercise | null
  language: 'en' | 'es'
  open: boolean
  onClose: () => void
  action?: ReactNode
}

export function ExerciseInfoModal({ exercise, language, open, onClose, action }: ExerciseInfoModalProps) {
  const { t } = useTranslation()
  if (!exercise) return null
  const instructions = language === 'es' ? exercise.instructionsEs : exercise.instructions
  const mediaUrl = exercise.gifUrl ?? exercise.imageUrl
  return <Modal open={open} onClose={onClose} title={t('exercises.details')} size="lg"><div className="exercise-info-grid"><div><div className="exercise-info-media">{mediaUrl ? <img src={mediaUrl} alt={localizedName(exercise, language)} onError={(event) => { event.currentTarget.style.display = 'none' }} /> : <Dumbbell size={42} />}</div><a className="source-link" href={exercise.sourceUrl} target="_blank" rel="noreferrer">{t('exercises.source')} <ArrowUpRight size={12} /></a></div><div className="exercise-modal-copy"><div className="exercise-info-title"><div><span className="eyebrow-label"><Info size={11} />{exercise.muscleGroup}</span><h3>{localizedName(exercise, language)}</h3></div></div><p>{exercise.description}</p><div className="exercise-meta"><span>{exercise.category}</span><span>{exercise.muscleGroup}</span><span>{exercise.target}</span><span>{exercise.equipment}</span></div><SectionHeading title={t('exercises.instructions')} />{instructions.length ? <ol className="instruction-list">{instructions.map((instruction, index) => <li key={`${exercise.id}-${index}`}><i>{index + 1}</i>{instruction}</li>)}</ol> : <p className="library-note">{t('common.noData')}</p>}{action && <div className="modal-actions">{action}</div>}</div></div></Modal>
}

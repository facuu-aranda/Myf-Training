import { ArrowLeft, Dumbbell } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Field, GlassCard, NeonButton, SectionHeading, TextAreaField } from '../components/ui'
import { UpgradePrompt } from '../components/FeatureGate'
import { useEntitlements } from '../lib/entitlements'
import { PageMotion } from '../components/PageMotion'
import { createCustomExercise } from '../lib/exercise'

export function CustomExercisePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { has, isLoading: entitlementsLoading } = useEntitlements()
  const [form, setForm] = useState({ name: '', nameEs: '', description: '', muscleGroup: '', target: '', category: '', equipment: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))
  if (!entitlementsLoading && !has('custom_exercises_create')) return <PageMotion><UpgradePrompt entitlement="custom_exercises_create" plan="Plus" /></PageMotion>
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    try { await createCustomExercise(form); navigate('/app/exercises') } catch { setError(t('exercises.customCreateError')) } finally { setIsSaving(false) }
  }
  return <PageMotion><div className="custom-exercise-page"><Link className="coach-back-link" to="/app/exercises"><ArrowLeft size={14} />{t('common.back')}</Link><GlassCard><SectionHeading eyebrow={t('exercises.customEyebrow')} title={t('exercises.customTitle')} description={t('exercises.customHint')} /><form className="settings-form" onSubmit={submit}><div className="settings-grid"><Field label={t('exercises.customName')} value={form.name} onChange={(event) => update('name', event.target.value)} required /><Field label={t('exercises.customNameEs')} value={form.nameEs} onChange={(event) => update('nameEs', event.target.value)} /><Field label={t('exercises.muscle')} value={form.muscleGroup} onChange={(event) => update('muscleGroup', event.target.value)} /><Field label={t('exercises.target')} value={form.target} onChange={(event) => update('target', event.target.value)} /><Field label={t('exercises.category')} value={form.category} onChange={(event) => update('category', event.target.value)} /><Field label={t('exercises.equipment')} value={form.equipment} onChange={(event) => update('equipment', event.target.value)} /></div><TextAreaField label={t('exercises.description')} value={form.description} onChange={(event) => update('description', event.target.value)} /><p className="custom-exercise-note"><Dumbbell size={14} />{t('exercises.customPrivacy')}</p>{error && <div className="inline-error" role="alert">{error}</div>}<div className="modal-actions"><NeonButton type="button" variant="ghost" onClick={() => navigate('/app/exercises')}>{t('common.cancel')}</NeonButton><NeonButton type="submit" loading={isSaving} disabled={!form.name.trim()}>{t('exercises.customCreate')}</NeonButton></div></form></GlassCard></div></PageMotion>
}

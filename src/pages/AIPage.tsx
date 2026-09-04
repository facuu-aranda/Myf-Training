import { Bot, Send, Sparkles, User } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageMotion } from '../components/PageMotion'
import { GlassCard, NeonButton, TextAreaField } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { confirmAICustomFood, sendAIMessage, type AIChatTurn } from '../lib/ai/client'
import type { AIActionProposal, AIContextScope } from '../lib/ai/types'

const availableScopes: Array<{ value: AIContextScope; label: string }> = [
  { value: 'profile', label: 'ai.profile' },
  { value: 'nutrition_today', label: 'ai.nutritionToday' },
  { value: 'workout_today', label: 'ai.workoutToday' },
]

function ActionSummary({ proposal, t, spanish }: { proposal: AIActionProposal; t: (key: string) => string; spanish: boolean }) {
  const draft = proposal.draft && typeof proposal.draft === 'object' && !Array.isArray(proposal.draft) ? proposal.draft as Record<string, unknown> : {}
  const name = String((spanish ? draft.foodNameEs ?? draft.recipeNameEs ?? draft.name : draft.foodName ?? draft.recipeName ?? draft.name) ?? '—')
  const rows: Array<[string, string]> = proposal.actionType === 'create_custom_food'
    ? [[t('ai.fields.name'), name], [t('ai.fields.portion'), `${draft.servingSize ?? '—'} ${draft.servingUnit ?? ''}`], [t('ai.fields.calories'), `${draft.calories ?? '—'} kcal`], [t('ai.fields.protein'), `${draft.protein ?? '—'} g`], [t('ai.fields.carbs'), `${draft.carbs ?? '—'} g`], [t('ai.fields.fat'), `${draft.fat ?? '—'} g`]]
    : proposal.actionType === 'create_workout_draft'
      ? [[t('ai.fields.name'), name], [t('ai.fields.weekday'), String(draft.weekday ?? '—')], [t('ai.fields.exerciseCount'), String(Array.isArray(draft.exerciseNames) ? draft.exerciseNames.length : Array.isArray(draft.exerciseIds) ? draft.exerciseIds.length : 0)]]
      : [[proposal.actionType === 'add_meal_to_plan' ? t('ai.fields.meal') : t('ai.fields.food'), name ?? (draft.foodId ? t('ai.fields.food') : draft.recipeId ? t('ai.fields.recipe') : '—')], [t('ai.fields.portion'), `${draft.quantity ?? '—'} ${draft.unit ?? ''}`], [t('ai.fields.date'), String(draft.planDate ?? (draft.mealType ?? '—'))]]
  return <div className="ai-action-details">{rows.map(([label, value]) => <div key={label}><span>{label}</span><strong>{String(value ?? '—')}</strong></div>)}</div>
}

export function AIPage() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [messages, setMessages] = useState<AIChatTurn[]>([])
  const [input, setInput] = useState('')
  const [scopes, setScopes] = useState<AIContextScope[]>(availableScopes.map((scope) => scope.value))
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [pendingAction, setPendingAction] = useState<AIActionProposal | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [notice, setNotice] = useState('')

  if (!user) return null

  const toggleScope = (scope: AIContextScope) => setScopes((current) => current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope])
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const message = input.trim()
    if (!message || isSending) return
    const nextMessages = [...messages, { role: 'user' as const, content: message }]
    setMessages(nextMessages)
    setInput('')
    setError('')
    setIsSending(true)
    try {
      const result = await sendAIMessage(message, messages, scopes, i18n.language.startsWith('es') ? 'es' : 'en')
      setMessages((current) => [...current, { role: 'assistant', content: result.answer }])
      setPendingAction(result.action ?? null)
    } catch (requestError) {
      setError(requestError instanceof Error && requestError.message === 'ai_not_configured' ? t('ai.unavailable') : t('ai.error'))
    } finally {
      setIsSending(false)
    }
  }

  const confirmAction = async () => {
    if (!pendingAction || pendingAction.actionType !== 'create_custom_food' || isConfirming) return
    setIsConfirming(true)
    setError('')
    try { await confirmAICustomFood(pendingAction); setPendingAction(null); setNotice(t('ai.actionSuccess')); window.setTimeout(() => setNotice(''), 3000) } catch { setError(t('ai.actionExecutionError')) } finally { setIsConfirming(false) }
  }
  const quickPrompts = [t('ai.promptFocus'), t('ai.promptNutrition'), t('ai.promptWorkout')]
  return <PageMotion><div className="ai-page"><div className="page-header"><div><span className="eyebrow-label">{t('nav.assistant')}</span><h1>{t('ai.title')}</h1><p>{t('ai.subtitle')}</p></div><span className="ai-status"><Sparkles size={14} />{t('ai.context')}</span></div><div className="ai-layout"><GlassCard className="ai-chat-card"><div className="ai-messages">{messages.length ? messages.map((message, index) => <div className={`ai-message ai-message-${message.role}`} key={`${message.role}-${index}`}><span className="ai-message-icon">{message.role === 'user' ? <User size={15} /> : <Bot size={15} />}</span><p>{message.content}</p></div>) : <div className="ai-welcome"><span className="ai-welcome-icon"><Bot size={22} /></span><h2>{t('ai.welcome')}</h2><p>{t('ai.empty')}</p><div className="ai-quick-prompts">{quickPrompts.map((prompt) => <button type="button" key={prompt} onClick={() => setInput(prompt)}>{prompt}</button>)}</div></div>}{isSending && <div className="ai-message ai-message-assistant"><span className="ai-message-icon"><Bot size={15} /></span><p>{t('ai.thinking')}</p></div>}</div>{pendingAction && <div className="ai-action-preview" role="status"><span className="eyebrow-label">{t('ai.actionTitle')}</span><strong>{t(`ai.actions.${pendingAction.actionType}`)}</strong><ActionSummary proposal={pendingAction} t={t} spanish={i18n.language.startsWith('es')} /><p>{t('ai.actionPending')}</p><div className="ai-action-buttons"><NeonButton type="button" onClick={() => { void confirmAction() }} loading={isConfirming} disabled={pendingAction.actionType !== 'create_custom_food'}>{pendingAction.actionType === 'create_custom_food' ? t('ai.confirmAction') : t('ai.confirmSoon')}</NeonButton><NeonButton type="button" variant="ghost" onClick={() => setPendingAction(null)}>{t('ai.cancelAction')}</NeonButton></div></div>}{notice && <div className="inline-success" role="status">{notice}</div>}{error && <div className="inline-error" role="alert">{error}</div>}<form className="ai-composer" onSubmit={submit}><TextAreaField label={t('ai.placeholder')} value={input} onChange={(event) => setInput(event.target.value)} placeholder={t('ai.placeholder')} rows={3} /><NeonButton type="submit" loading={isSending} disabled={!input.trim()}><Send size={14} />{t('ai.send')}</NeonButton></form></GlassCard><GlassCard className="ai-context-card"><h2>{t('ai.context')}</h2><p>{t('ai.contextHint')}</p><div className="ai-context-list">{availableScopes.map((scope) => <label key={scope.value}><input type="checkbox" checked={scopes.includes(scope.value)} onChange={() => toggleScope(scope.value)} />{t(scope.label)}</label>)}</div><p className="ai-privacy-note">{t('ai.privacy')}</p></GlassCard></div></div></PageMotion>
}

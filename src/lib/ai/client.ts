import { supabase } from '../supabase'
import type { AIActionProposal, AIContextScope } from './types'

export interface AIChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface AIChatResult {
  answer: string
  scopes: AIContextScope[]
  date: string
  action?: AIActionProposal
}

export async function confirmAICustomFood(proposal: AIActionProposal): Promise<{ foodId: string }> {
  if (!supabase) throw new Error('ai_not_configured')
  if (proposal.actionType !== 'create_custom_food') throw new Error('ai_action_not_available')
  const result = await supabase.functions.invoke<{ ok: boolean; foodId: string }>('ai-assistant', { body: { confirmAction: proposal } })
  if (result.error) throw result.error
  if (!result.data?.ok || typeof result.data.foodId !== 'string') throw new Error('ai_action_failed')
  return { foodId: result.data.foodId }
}

export async function sendAIMessage(message: string, history: AIChatTurn[], scopes: AIContextScope[] = ['profile', 'nutrition_today', 'workout_today'], language: 'en' | 'es' = 'en'): Promise<AIChatResult> {
  if (!supabase) throw new Error('ai_not_configured')
  const result = await supabase.functions.invoke<AIChatResult>('ai-assistant', { body: { message, history: history.slice(-10), scopes, language } })
  if (result.error) throw result.error
  if (!result.data || typeof result.data.answer !== 'string') throw new Error('ai_invalid_response')
  return result.data
}

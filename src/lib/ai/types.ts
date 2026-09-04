import type { Json } from '../../types'

export type AIContextScope = 'profile' | 'nutrition_today' | 'workout_today' | 'nutrition_week' | 'training_week' | 'progress' | 'saved_foods' | 'household'
export type AIActionType = 'create_custom_food' | 'log_food' | 'add_meal_to_plan' | 'create_workout_draft'

export type AIMessageRole = 'system' | 'user' | 'assistant' | 'tool'

export interface AIMessage {
  role: AIMessageRole
  content: string
  name?: string
  toolCallId?: string
}

export interface AIToolDefinition {
  name: string
  description: string
  inputSchema: Json
}

export interface AIChatRequest {
  messages: AIMessage[]
  context: AIContext
  tools?: AIToolDefinition[]
  temperature?: number
  maxTokens?: number
}

export interface AIActionProposal {
  actionId: string
  actionType: AIActionType
  requiresConfirmation: true
  draft: Json
}

export interface AIChatResponse {
  message: AIMessage
  toolCalls?: AIToolCall[]
  action?: AIActionProposal
  usage?: { inputTokens?: number; outputTokens?: number }
}

export interface AIStreamChunk {
  type: 'text_delta' | 'tool_call' | 'done'
  text?: string
  toolCall?: AIToolCall
}

export interface AIStructuredRequest<T> extends AIChatRequest {
  outputSchema: Json
  validate: (value: unknown) => value is T
}

export interface AIToolCall {
  id: string
  name: string
  arguments: Json
}

export interface AIContext {
  userId: string
  date: string
  scopes: AIContextScope[]
  data: Partial<Record<AIContextScope, Json>>
}

export interface AIModelConfig {
  generalModel: string
  planningModel: string
  fastModel?: string
}

export interface AIProviderCapabilities {
  supportsToolCalling: boolean
  supportsStructuredOutput: boolean
  supportsStreaming: boolean
}

export type AIErrorCode = 'provider_timeout' | 'provider_rate_limit' | 'provider_unavailable' | 'invalid_tool_arguments' | 'missing_context' | 'forbidden_data' | 'validation_error' | 'action_execution_error'

export class AIError extends Error {
  constructor(public readonly code: AIErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'AIError'
  }
}

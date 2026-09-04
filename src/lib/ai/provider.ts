import { AIError } from './errors'
import type { AIChatRequest, AIChatResponse, AIProviderCapabilities, AIStreamChunk, AIStructuredRequest } from './types'

export interface AIProvider {
  readonly capabilities: AIProviderCapabilities
  chat(input: AIChatRequest): Promise<AIChatResponse>
  structured<T>(input: AIStructuredRequest<T>): Promise<T>
  stream?(input: AIChatRequest): AsyncIterable<AIStreamChunk>
}

export function createUnavailableAIProvider(): AIProvider {
  const unavailable = () => {
    throw new AIError('provider_unavailable', 'AI provider is not configured. Use the protected Edge Function before enabling AI.')
  }
  return {
    capabilities: { supportsToolCalling: false, supportsStructuredOutput: false, supportsStreaming: false },
    chat: async () => unavailable(),
    structured: async () => unavailable(),
  }
}

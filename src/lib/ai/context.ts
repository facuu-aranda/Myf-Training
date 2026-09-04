import { AIError } from './errors'
import type { AIContext, AIContextScope } from './types'
import type { Json } from '../../types'

export interface BuildAIContextInput {
  userId: string
  scopes: AIContextScope[]
  date: string
  data: Partial<Record<AIContextScope, Json>>
}

export async function buildAIContext(input: BuildAIContextInput): Promise<AIContext> {
  if (!input.userId) throw new AIError('missing_context', 'An authenticated user is required to build AI context.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new AIError('missing_context', 'AI context requires a valid date.')
  const scopes = [...new Set(input.scopes)]
  const data = scopes.reduce<Partial<Record<AIContextScope, Json>>>((result, scope) => {
    if (input.data[scope] !== undefined) result[scope] = input.data[scope]
    return result
  }, {})
  return { userId: input.userId, date: input.date, scopes, data }
}

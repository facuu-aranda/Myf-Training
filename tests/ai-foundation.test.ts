import { describe, expect, it } from 'vitest'
import { buildAIContext } from '../src/lib/ai/context'
import { AIError } from '../src/lib/ai/errors'
import { createUnavailableAIProvider } from '../src/lib/ai/provider'
import { readOnlyTools, toolsForScopes } from '../supabase/functions/ai-assistant/tools'

describe('AI context boundary', () => {
  it('includes only requested scopes', async () => {
    const context = await buildAIContext({ userId: 'user-1', date: '2026-09-03', scopes: ['profile'], data: { profile: { dailyCalories: 2200 }, progress: { volume: 100 } } })
    expect(context.scopes).toEqual(['profile'])
    expect(context.data).toEqual({ profile: { dailyCalories: 2200 } })
  })

  it('rejects missing users and invalid dates', async () => {
    await expect(buildAIContext({ userId: '', date: '2026-09-03', scopes: [], data: {} })).rejects.toMatchObject<Partial<AIError>>({ code: 'missing_context' })
    await expect(buildAIContext({ userId: 'user-1', date: '03/09/2026', scopes: [], data: {} })).rejects.toMatchObject<Partial<AIError>>({ code: 'missing_context' })
  })
})

describe('AI tool boundary', () => {
  it('exposes only read-only tools and filters them by context', () => {
    expect(readOnlyTools.some((tool) => tool.function.name === 'create_custom_food')).toBe(false)
    expect(toolsForScopes(['profile']).map((tool) => tool.function.name)).toEqual(['get_user_profile'])
    expect(toolsForScopes(['nutrition_today']).map((tool) => tool.function.name)).toContain('calculate_food_impact')
  })
})

describe('AI provider boundary', () => {
  it('fails closed while no protected provider is configured', async () => {
    const provider = createUnavailableAIProvider()
    await expect(provider.chat({ messages: [], context: { userId: 'user-1', date: '2026-09-03', scopes: [], data: {} } })).rejects.toMatchObject<Partial<AIError>>({ code: 'provider_unavailable' })
  })
})

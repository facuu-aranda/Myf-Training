import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { executeReadOnlyTool, isWriteTool, toolsForScopes } from './tools.ts'

type ChatMessage = { role: 'user' | 'assistant'; content: string }
type ActionType = 'create_custom_food' | 'log_food' | 'add_meal_to_plan' | 'create_workout_draft'
type ContextScope = 'profile' | 'nutrition_today' | 'workout_today'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

function validMessage(value: unknown): value is ChatMessage {
  return Boolean(value && typeof value === 'object' && ((value as ChatMessage).role === 'user' || (value as ChatMessage).role === 'assistant') && typeof (value as ChatMessage).content === 'string' && (value as ChatMessage).content.length <= 4000)
}

async function buildContext(client: ReturnType<typeof createClient>, userId: string, scopes: ContextScope[], date: string) {
  const data: Record<string, unknown> = {}
  if (scopes.includes('profile')) {
    const { data: profile, error } = await client.from('profiles').select('id, display_name, daily_calorie_goal, daily_step_goal').eq('id', userId).maybeSingle()
    if (error) throw new Error(`profile_context: ${error.message}`)
    data.profile = profile
  }
  if (scopes.includes('nutrition_today')) {
    const { data: plan, error: planError } = await client.from('nutrition_plans').select('calories, protein, carbs, fats, fiber').eq('user_id', userId).order('starts_on', { ascending: false }).limit(1).maybeSingle()
    if (planError) throw new Error(`nutrition_context: ${planError.message}`)
    const { data: logs, error: logError } = await client.from('food_logs').select('id, meal_type, notes, food_log_items(quantity, unit, food_id, recipe_id)').eq('user_id', userId).eq('consumed_on', date).order('consumed_at', { ascending: true })
    if (logError) throw new Error(`food_log_context: ${logError.message}`)
    data.nutrition_today = { date, plan, foodLogCount: logs?.length ?? 0, foodLog: logs ?? [] }
  }
  if (scopes.includes('workout_today')) {
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay() || 7
    const { data: workout, error } = await client.from('workout_days').select('id, name, name_es, estimated_minutes, workout_exercises(exercise_id, sets, target_reps, target_seconds, target_weight, rest_seconds)').eq('user_id', userId).eq('weekday', weekday).eq('active', true).maybeSingle()
    if (error) throw new Error(`workout_context: ${error.message}`)
    data.workout_today = workout
  }
  return data
}

async function enrichActionDraft(client: ReturnType<typeof createClient>, actionType: ActionType, value: Record<string, unknown>) {
  const draft = { ...value }
  if ((actionType === 'log_food' || actionType === 'add_meal_to_plan') && typeof value.foodId === 'string') {
    const result = await client.from('foods').select('name, name_es').eq('id', value.foodId).maybeSingle()
    if (!result.error && result.data) { draft.foodName = result.data.name; draft.foodNameEs = result.data.name_es }
  }
  if ((actionType === 'log_food' || actionType === 'add_meal_to_plan') && typeof value.recipeId === 'string') {
    const result = await client.from('recipes').select('name, name_es').eq('id', value.recipeId).maybeSingle()
    if (!result.error && result.data) { draft.recipeName = result.data.name; draft.recipeNameEs = result.data.name_es }
  }
  if (actionType === 'create_workout_draft' && Array.isArray(value.exerciseIds)) {
    const exerciseIds = value.exerciseIds.filter((id): id is string => typeof id === 'string').slice(0, 20)
    if (exerciseIds.length) {
      const result = await client.from('exercises').select('id, name, name_es').in('id', exerciseIds)
      if (!result.error) draft.exerciseNames = result.data ?? []
    }
  }
  return draft
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return response({ error: 'method_not_allowed' }, 405)

  const authorization = request.headers.get('Authorization')
  const token = authorization?.replace(/^Bearer\s+/i, '')
  const groqKey = Deno.env.get('GROQ_API_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!token || !supabaseUrl || !supabaseAnonKey) return response({ error: 'unauthorized' }, 401)
  if (!groqKey) return response({ error: 'provider_unavailable' }, 503)

  const client = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } })
  const { data: authData, error: authError } = await client.auth.getUser(token)
  if (authError || !authData.user) return response({ error: 'unauthorized' }, 401)

  let body: { message?: unknown; history?: unknown; scopes?: unknown; language?: unknown }
  try { body = await request.json() } catch { return response({ error: 'invalid_json' }, 400) }
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!message || message.length > 4000) return response({ error: 'invalid_message' }, 400)
  const history = Array.isArray(body.history) ? body.history.filter(validMessage).slice(-10) : []
  const requestedScopes = Array.isArray(body.scopes) ? body.scopes.filter((scope): scope is ContextScope => scope === 'profile' || scope === 'nutrition_today' || scope === 'workout_today') : ['profile']
  const scopes = [...new Set<ContextScope>(requestedScopes)]
  const language = body.language === 'es' ? 'es' : 'en'
  const date = new Date().toISOString().slice(0, 10)

  try {
    const context = await buildContext(client, authData.user.id, scopes, date)
    const messages: Array<Record<string, unknown>> = [
      { role: 'system', content: `You are Train Together, a careful fitness and nutrition assistant. Answer in ${language === 'es' ? 'Spanish' : 'English'}. Use only the context and read-only tools available. Do not invent IDs or numeric nutrition values. Explain that calculations must come from the application domain. Never claim an action was executed; this MVP has no write tools. Do not provide medical diagnosis.\n\nContext scopes: ${scopes.join(', ')}\nContext JSON: ${JSON.stringify(context)}` },
      ...history,
      { role: 'user', content: message },
    ]

    for (let round = 0; round < 3; round += 1) {
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: Deno.env.get('AI_MODEL') || 'openai/gpt-oss-120b', temperature: 0.2, max_tokens: 700, messages, tools: toolsForScopes(scopes), tool_choice: 'auto' }),
      })
      if (!groqResponse.ok) {
        if (groqResponse.status === 429) return response({ error: 'provider_rate_limit' }, 429)
        if (groqResponse.status >= 500) return response({ error: 'provider_unavailable' }, 503)
        return response({ error: 'provider_error' }, 502)
      }
      const completion = await groqResponse.json()
      const assistantMessage = completion?.choices?.[0]?.message
      if (!assistantMessage || typeof assistantMessage !== 'object') return response({ error: 'empty_response' }, 502)
      const toolCalls = Array.isArray(assistantMessage.tool_calls) ? assistantMessage.tool_calls : []
      if (!toolCalls.length) {
        const answer = assistantMessage.content
        if (typeof answer !== 'string' || !answer.trim()) return response({ error: 'empty_response' }, 502)
        return response({ answer: answer.trim(), scopes, date })
      }
      if (toolCalls.length > 4) return response({ error: 'tool_limit_exceeded' }, 422)
      messages.push(assistantMessage as Record<string, unknown>)
      for (const toolCall of toolCalls) {
        const call = toolCall as { id?: unknown; function?: { name?: unknown; arguments?: unknown } }
        const id = typeof call.id === 'string' ? call.id : ''
        const name = typeof call.function?.name === 'string' ? call.function.name : ''
        if (!id || !name) return response({ error: 'invalid_tool_arguments' }, 422)
        let argumentsValue: unknown = {}
        try { argumentsValue = typeof call.function?.arguments === 'string' ? JSON.parse(call.function.arguments) : call.function?.arguments ?? {} } catch { return response({ error: 'invalid_tool_arguments' }, 422) }
        if (isWriteTool(name)) {
          if (!argumentsValue || typeof argumentsValue !== 'object' || Array.isArray(argumentsValue)) return response({ error: 'invalid_tool_arguments' }, 422)
          const draft = await enrichActionDraft(client, name as ActionType, argumentsValue as Record<string, unknown>)
          const proposalMessage = language === 'es' ? 'Preparé un borrador para que lo revises. No se realizaron cambios.' : 'I prepared a draft for your confirmation. No changes were made.'
          return response({ answer: proposalMessage, action: { actionType: name as ActionType, requiresConfirmation: true, draft }, scopes, date })
        }
        try {
          const result = await executeReadOnlyTool(name, argumentsValue, { client, userId: authData.user.id, date })
          messages.push({ role: 'tool', tool_call_id: id, name, content: JSON.stringify(result) })
        } catch (toolError) {
          const toolMessage = toolError instanceof Error && toolError.message === 'invalid_tool_arguments' ? 'Invalid tool arguments.' : 'Tool unavailable. No private data was returned.'
          messages.push({ role: 'tool', tool_call_id: id, name, content: toolMessage })
        }
      }
    }
    return response({ error: 'tool_loop_limit' }, 422)
  } catch (error) {
    console.error('ai-assistant failed', error instanceof Error ? error.message : error)
    return response({ error: 'context_error' }, 500)
  }
})

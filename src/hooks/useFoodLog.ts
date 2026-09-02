import { useCallback, useEffect, useState } from 'react'
import { subscribeToNutritionChanges } from '../lib/supabase'
import { deleteFoodLog, loadFoodLogs, saveFoodLog } from '../lib/repository'
import type { FoodLog } from '../types'

export function useFoodLog(userId: string | undefined, date: string) {
  const [logs, setLogs] = useState<FoodLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!userId) { setLogs([]); setIsLoading(false); return }
    setIsLoading(true)
    setError('')
    try { setLogs(await loadFoodLogs(userId, date)) } catch { setError('Could not load your food log.') } finally { setIsLoading(false) }
  }, [date, userId])

  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => { const unsubscribe = subscribeToNutritionChanges(() => { void refresh() }); return unsubscribe }, [refresh])

  const save = useCallback(async (log: FoodLog) => {
    try { await saveFoodLog(log); await refresh() } catch (error) { setError('Could not save your food log.'); throw error }
  }, [refresh])

  const remove = useCallback(async (logId: string) => {
    try { await deleteFoodLog(logId); await refresh() } catch (error) { setError('Could not delete your food log.'); throw error }
  }, [refresh])

  return { logs, isLoading, error, save, remove, refresh }
}

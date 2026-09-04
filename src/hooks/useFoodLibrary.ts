import { useCallback, useEffect, useState } from 'react'
import { countFoods, loadFoodFavoriteIds, loadFoods, setFoodFavorite } from '../lib/repository'

export type FoodLibraryScope = 'all' | 'global' | 'mine'
import type { Food } from '../types'

const PAGE_SIZE = 60

export function useFoodLibrary(userId?: string, scope: FoodLibraryScope = 'all') {
  const [foods, setFoods] = useState<Food[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set())
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async (searchValue: string) => {
    setIsLoading(true)
    setError('')
    try {
      const [nextFoods, nextTotal] = await Promise.all([loadFoods({ search: searchValue, limit: PAGE_SIZE, offset: 0, scope }), countFoods(searchValue, scope, userId)])
      setFoods(nextFoods)
      setTotalCount(nextTotal)
      setHasMore(nextFoods.length < nextTotal)
    } catch {
      setError('Could not load the food library.')
    } finally {
      setIsLoading(false)
    }
  }, [scope, userId])

  useEffect(() => { const timer = window.setTimeout(() => { void refresh(search) }, 180); return () => window.clearTimeout(timer) }, [refresh, search])

  useEffect(() => {
    let active = true
    if (!userId) { setFavoriteIds(new Set()); return () => { active = false } }
    void loadFoodFavoriteIds(userId).then((ids) => { if (active) setFavoriteIds(new Set(ids)) }).catch(() => { if (active) setError('Could not load your food favorites.') })
    return () => { active = false }
  }, [userId])

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    try {
      const nextFoods = await loadFoods({ search, limit: PAGE_SIZE, offset: foods.length, scope })
      setFoods((current) => [...current, ...nextFoods])
      setHasMore(foods.length + nextFoods.length < totalCount)
    } catch {
      setError('Could not load more foods.')
    } finally {
      setIsLoadingMore(false)
    }
  }, [foods.length, hasMore, isLoading, isLoadingMore, scope, search, totalCount])

  const toggleFavorite = useCallback(async (foodId: string) => {
    if (!userId) return
    const wasFavorite = favoriteIds.has(foodId)
    setFavoriteIds((current) => { const next = new Set(current); if (wasFavorite) next.delete(foodId); else next.add(foodId); return next })
    try {
      await setFoodFavorite(userId, foodId, !wasFavorite)
    } catch {
      setFavoriteIds((current) => { const next = new Set(current); if (wasFavorite) next.add(foodId); else next.delete(foodId); return next })
      setError('Could not update your food favorite.')
    }
  }, [favoriteIds, userId])

  return { foods, totalCount, favoriteIds, search, setSearch, isLoading, isLoadingMore, hasMore, error, toggleFavorite, loadMore, refresh: () => refresh(search) }
}

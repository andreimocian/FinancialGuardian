import { useState, useEffect, useCallback } from 'react'
import { goalsApi } from '../goalsApi'
import type { BackendGoal, CreateGoalPayload } from '../goalsApi'

export type { BackendGoal }

export function useGoals() {
  const [goals,     setGoals]     = useState<BackendGoal[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState<string | null>(null)

  const fetchGoals = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await goalsApi.getAll()
      setGoals(res.goals ?? [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  const addGoal = useCallback(async (payload: CreateGoalPayload) => {
    const res = await goalsApi.create(payload)
    setGoals(prev => [...prev, res.goal])
    return res.goal
  }, [])

  const updateSaved = useCallback(async (id: string, currentSaved: number) => {
    const res = await goalsApi.update(id, { currentSaved })
    setGoals(prev => prev.map(g => g._id === id ? res.goal : g))
  }, [])

  const removeGoal = useCallback(async (id: string) => {
    await goalsApi.remove(id)
    setGoals(prev => prev.filter(g => g._id !== id))
  }, [])

  const analyzeGoal = useCallback(async (id: string) => {
    setAnalyzing(id)
    try {
      const res = await goalsApi.analyze(id)
      setGoals(prev => prev.map(g => g._id === id ? res.goal : g))
    } finally {
      setAnalyzing(null)
    }
  }, [])

  return { goals, loading, error, analyzing, addGoal, updateSaved, removeGoal, analyzeGoal, refetch: fetchGoals }
}

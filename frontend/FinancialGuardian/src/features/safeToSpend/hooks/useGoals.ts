import { useState, useCallback, useEffect } from 'react'
import type { SavingsGoal } from '../types'

const STORAGE_KEY = 'guardian_savings_goals'

function load(): SavingsGoal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function save(goals: SavingsGoal[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(goals)) } catch {}
}

function uid() { return Math.random().toString(36).slice(2) }

export function useGoals() {
  const [goals, setGoals] = useState<SavingsGoal[]>(load)

  useEffect(() => { save(goals) }, [goals])

  const addGoal = useCallback((
    name: string,
    targetAmount: number,
    deadline?: string,
    emoji?: string,
  ) => {
    setGoals(prev => [...prev, {
      id: uid(), name, targetAmount, savedAmount: 0,
      deadline, emoji: emoji ?? '🎯',
      createdAt: new Date().toISOString(),
    }])
  }, [])

  const updateSaved = useCallback((id: string, savedAmount: number) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, savedAmount } : g))
  }, [])

  const removeGoal = useCallback((id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id))
  }, [])

  return { goals, addGoal, updateSaved, removeGoal }
}

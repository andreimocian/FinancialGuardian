import { useState, useEffect, useCallback } from 'react'
import type { FinancialSnapshot } from '../types'

const API_URL = 'http://localhost:3000/api'

async function get(path: string) {
  const res = await fetch(`${API_URL}${path}`, { credentials: 'include' })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

// ─── Current month bounds ─────────────────────────────────────────────────────

function currentMonthBounds(): { start: Date; end: Date } {
  const now   = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  return { start, end }
}

export function useSafeToSpend() {
  const [snapshot, setSnapshot] = useState<FinancialSnapshot | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [txRes, billRes] = await Promise.allSettled([
        get('/transactions'),
        get('/obligations'),
      ])

      let income   = 0
      let expenses = 0
      const catMap = new Map<string, number>()

      if (txRes.status === 'fulfilled') {
        const allTxs: any[] = txRes.value.transactions ?? []
        const { start, end } = currentMonthBounds()

        // Filter to current month only — avoid all-time totals skewing numbers
        const txs = allTxs.filter(t => {
          const d = new Date(t.date)
          return d >= start && d <= end
        })

        txs.forEach(t => {
          const amt = t.amount ?? 0
          if (t.type === 'income') {
            income += amt
          } else {
            expenses += amt
            const cat = t.category ?? 'other'
            catMap.set(cat, (catMap.get(cat) ?? 0) + amt)
          }
        })
      }

      let billsTotal = 0
      if (billRes.status === 'fulfilled') {
        const bills: any[] = billRes.value.obligations ?? []
        bills
          .filter(b => !b.paid)
          .forEach(b => { billsTotal += b.amount ?? 0 })
      }

      const safeToSpend = Math.max(0, income - expenses - billsTotal)

      const expensesByCategory = Array.from(catMap.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)

      setSnapshot({ income, expenses, billsTotal, safeToSpend, expensesByCategory })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return { snapshot, loading, error, refetch: fetchData }
}
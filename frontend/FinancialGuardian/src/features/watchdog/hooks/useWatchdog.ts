import { useState, useEffect, useCallback } from 'react'
import type { AggregatedPayment, CategoryBreakdown, WatchdogAlert } from '../types'

const API_URL = import.meta.env.VITE_BACKEND_URL

async function get(path: string) {
  const res = await fetch(`${API_URL}${path}`, { credentials: 'include' })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

// ─── Category colors ──────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  food:          '#f59e0b',
  groceries:     '#10b981',
  transport:     '#60a5fa',
  entertainment: '#a78bfa',
  health:        '#34d399',
  shopping:      '#f472b6',
  utilities:     '#fbbf24',
  salary:        '#2dd4bf',
  income:        '#2dd4bf',
  rent:          '#818cf8',
  travel:        '#fb7185',
  subscriptions: '#c084fc',
  lease:         '#818cf8',
  utility:       '#fbbf24',
  insurance:     '#6ee7b7',
  internet:      '#60a5fa',
  phone:         '#f472b6',
  bill:          '#cbd5e1',
  other:         '#64748b',
}

function colorFor(cat?: string): string {
  return CATEGORY_COLORS[cat?.toLowerCase() ?? 'other'] ?? CATEGORY_COLORS.other
}

// ─── Alert generator ──────────────────────────────────────────────────────────

function generateAlerts(
  bills: AggregatedPayment[],
  contracts: AggregatedPayment[],
): WatchdogAlert[] {
  const alerts: WatchdogAlert[] = []

  // Bill alerts
  bills.forEach(p => {
    const days = p.daysLeft ?? null

    if (!p.paid && days !== null && days < 0) {
      alerts.push({
        id: `overdue-${p.id}`, kind: 'bill_overdue', severity: 'critical',
        name: p.name,
        message: `${p.name} bill is ${Math.abs(days)} days overdue`,
        action: 'Pay now', daysLeft: days, amount: p.amount, source: 'bill',
      })
    }

    if (!p.paid && days !== null && days >= 0 && days <= 7) {
      alerts.push({
        id: `due-soon-${p.id}`, kind: 'bill_due_soon',
        severity: days <= 3 ? 'critical' : 'warning',
        name: p.name,
        message: days === 0 ? `${p.name} is due today` : `${p.name} is due in ${days} day${days === 1 ? '' : 's'}`,
        action: 'Pay bill', daysLeft: days, amount: p.amount, source: 'bill',
      })
    }
  })

  // Contract alerts (notice deadlines + expiry — future Gmail use)
  contracts.forEach(c => {
    const days = c.daysLeft ?? null

    if (c.noticePeriodDays && c.endDate) {
      const noticeDate = new Date(c.endDate)
      noticeDate.setDate(noticeDate.getDate() - (c.noticePeriodDays ?? 0))
      const daysToNotice = Math.ceil((noticeDate.getTime() - Date.now()) / 86400000)

      if (daysToNotice >= 0 && daysToNotice <= 30) {
        alerts.push({
          id: `notice-${c.id}`, kind: 'notice_deadline',
          severity: daysToNotice <= 7 ? 'critical' : 'warning',
          name: c.name,
          message: daysToNotice === 0
            ? `Last day to give notice for ${c.name} contract`
            : `Give notice for ${c.name} within ${daysToNotice} days or it auto-renews`,
          action: 'Review contract', daysLeft: daysToNotice, amount: c.amount, source: 'contract',
        })
      }
    }

    if (days !== null && days >= 0 && days <= 60) {
      alerts.push({
        id: `expiring-${c.id}`, kind: 'contract_expiring',
        severity: days <= 14 ? 'warning' : 'info',
        name: c.name,
        message: `${c.name} contract ends in ${days} days`,
        action: 'Plan ahead', daysLeft: days, amount: c.amount, source: 'contract',
      })
    }
  })

  return alerts.sort((a, b) => {
    const sv = { critical: 0, warning: 1, info: 2 }
    if (sv[a.severity] !== sv[b.severity]) return sv[a.severity] - sv[b.severity]
    return (a.daysLeft ?? 999) - (b.daysLeft ?? 999)
  })
}

// ─── useWatchdog ──────────────────────────────────────────────────────────────

export function useWatchdog() {
  const [payments,  setPayments]  = useState<AggregatedPayment[]>([])
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([])
  const [alerts,    setAlerts]    = useState<WatchdogAlert[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Contracts fetched for alert generation only — NOT added to charts/totals
      const [txRes, billRes, contractRes] = await Promise.allSettled([
        get('/transactions'),
        get('/obligations'),
        get('/contracts'),
      ])

      const aggregated: AggregatedPayment[] = []
      const billPayments: AggregatedPayment[] = []
      const contractPayments: AggregatedPayment[] = []

      // Transactions — expenses only, aggregated
      if (txRes.status === 'fulfilled') {
        txRes.value.transactions
          ?.filter((t: any) => t.type === 'expense')
          .forEach((t: any) => {
            aggregated.push({
              id:       t._id,
              name:     t.merchant ?? t.name ?? 'Unknown',
              amount:   t.amount ?? 0,
              category: t.category,
              source:   'transaction',
              currency: t.currency ?? 'EUR',
            })
          })
      }

      // Bills — aggregated into charts + tracked for alerts
      if (billRes.status === 'fulfilled') {
        billRes.value.obligations?.forEach((b: any) => {
          const daysLeft = b.dueDate
            ? Math.ceil((new Date(b.dueDate).getTime() - Date.now()) / 86400000)
            : undefined
          const p: AggregatedPayment = {
            id:       b._id,
            name:     b.provider ?? 'Unknown',
            amount:   b.amount ?? 0,
            category: b.contractType ?? 'bill',
            source:   'bill',
            currency: b.currency ?? 'EUR',
            dueDate:  b.dueDate,
            daysLeft,
            paid:     b.paid,
          }
          aggregated.push(p)
          billPayments.push(p)
        })
      }

      // Contracts — alerts only, NOT in charts or totals
      if (contractRes.status === 'fulfilled') {
        contractRes.value.contracts?.forEach((c: any) => {
          const daysLeft = c.endDate
            ? Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86400000)
            : undefined
          contractPayments.push({
            id:               c._id,
            name:             c.provider ?? 'Unknown',
            amount:           c.monthlyAmount ?? 0,
            category:         'contract',
            source:           'contract',
            currency:         c.currency ?? 'EUR',
            endDate:          c.endDate,
            daysLeft,
            noticePeriodDays: c.noticePeriodDays,
            cancellationTerms: c.cancellationTerms,
          })
        })
      }

      setPayments(aggregated)

      // Breakdown from transactions + bills only
      const catMap = new Map<string, { amount: number; count: number }>()
      aggregated.forEach(p => {
        const cat = p.category ?? 'other'
        const cur = catMap.get(cat) ?? { amount: 0, count: 0 }
        catMap.set(cat, { amount: cur.amount + p.amount, count: cur.count + 1 })
      })

      setBreakdown(
        Array.from(catMap.entries())
          .map(([category, { amount, count }]) => ({
            category, amount, count, color: colorFor(category),
          }))
          .sort((a, b) => b.amount - a.amount)
      )

      // Alerts from bills + contracts
      setAlerts(generateAlerts(billPayments, contractPayments))

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const topPayments  = [...payments].sort((a, b) => b.amount - a.amount).slice(0, 10)
  const totalMonthly = payments.reduce((s, p) => s + p.amount, 0)

  return { payments, topPayments, breakdown, alerts, totalMonthly, loading, error, refetch: fetchAll }
}

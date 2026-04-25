import { useMemo } from 'react'

type Transaction = {
  _id:      string
  merchant: string
  amount:   number
  type:     'income' | 'expense'
  category: string
  date:     string
}

export type DriftEvent = {
  category:      string
  baseline:      number   
  current:       number  
  ratio:         number   
  severity:      'mild' | 'high'
  topMerchant?:  string   
  count:         number   
}

export type DriftResult = {
  events:      DriftEvent[]
  isClean:     boolean
  periodDays:  number
}

const DRIFT_THRESHOLD_HIGH = 3.0  
const DRIFT_THRESHOLD_MILD = 2.0   
const BASELINE_DAYS        = 60    
const CURRENT_WINDOW_DAYS  = 7   

export function useDriftDetection(transactions: Transaction[]): DriftResult {
  return useMemo(() => {
    const now     = Date.now()
    const msDay   = 86400000

    const baselineStart = new Date(now - BASELINE_DAYS * msDay)
    const currentStart  = new Date(now - CURRENT_WINDOW_DAYS * msDay)

    const expenses = transactions.filter(t => t.type === 'expense')

    const baselineTxs = expenses.filter(t => {
      const d = new Date(t.date)
      return d >= baselineStart && d < currentStart
    })

    const baselinePeriodDays = BASELINE_DAYS - CURRENT_WINDOW_DAYS
    const baselineByCategory = new Map<string, number>()

    baselineTxs.forEach(t => {
      const cat = t.category ?? 'other'
      baselineByCategory.set(cat, (baselineByCategory.get(cat) ?? 0) + t.amount)
    })

    const baselineWeekly = new Map<string, number>()
    baselineByCategory.forEach((total, cat) => {
      baselineWeekly.set(cat, total / (baselinePeriodDays / 7))
    })

    const currentTxs = expenses.filter(t => new Date(t.date) >= currentStart)

    const currentByCategory  = new Map<string, number>()
    const currentCountByCat  = new Map<string, number>()
    const merchantsByCat     = new Map<string, Map<string, number>>()

    currentTxs.forEach(t => {
      const cat = t.category ?? 'other'
      currentByCategory.set(cat, (currentByCategory.get(cat) ?? 0) + t.amount)
      currentCountByCat.set(cat, (currentCountByCat.get(cat) ?? 0) + 1)

      if (!merchantsByCat.has(cat)) merchantsByCat.set(cat, new Map())
      const merchants = merchantsByCat.get(cat)!
      merchants.set(t.merchant, (merchants.get(t.merchant) ?? 0) + 1)
    })

    const events: DriftEvent[] = []

    currentByCategory.forEach((currentSpend, cat) => {
      const baseline = baselineWeekly.get(cat) ?? 0

      if (baseline < 1) return

      const ratio = currentSpend / baseline

      if (ratio >= DRIFT_THRESHOLD_MILD) {
        const merchants = merchantsByCat.get(cat)
        let topMerchant: string | undefined
        let topCount = 0
        merchants?.forEach((count, merchant) => {
          if (count > topCount) { topMerchant = merchant; topCount = count }
        })

        events.push({
          category:    cat,
          baseline:    Math.round(baseline * 100) / 100,
          current:     Math.round(currentSpend * 100) / 100,
          ratio:       Math.round(ratio * 10) / 10,
          severity:    ratio >= DRIFT_THRESHOLD_HIGH ? 'high' : 'mild',
          topMerchant,
          count:       currentCountByCat.get(cat) ?? 0,
        })
      }
    })

    events.sort((a, b) => b.ratio - a.ratio)

    return {
      events,
      isClean:    events.length === 0,
      periodDays: BASELINE_DAYS,
    }
  }, [transactions])
}

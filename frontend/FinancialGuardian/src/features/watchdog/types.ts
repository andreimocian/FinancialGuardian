// ─── Aggregated payment item ──────────────────────────────────────────────────

export type PaymentSource = 'transaction' | 'bill' | 'contract'

export type AggregatedPayment = {
  id:          string
  name:        string          // provider / merchant name
  amount:      number          // monthly or per-occurrence amount
  category?:   string
  source:      PaymentSource
  currency:    string
  // For bills/contracts
  dueDate?:    string
  daysLeft?:   number
  paid?:       boolean
  // For contracts
  noticePeriodDays?: number | null
  endDate?:    string
  cancellationTerms?: string
}

export type CategoryBreakdown = {
  category: string
  amount:   number
  color:    string
  count:    number
}

// ─── Notification alert types ─────────────────────────────────────────────────

export type AlertSeverity = 'critical' | 'warning' | 'info'
export type AlertKind =
  | 'notice_deadline'        // contract notice period approaching
  | 'bill_overdue'           // bill past due date
  | 'bill_due_soon'          // bill due within 7 days
  | 'subscription_unused'    // subscription with no recent activity
  | 'contract_expiring'      // contract ending soon

export type WatchdogAlert = {
  id:          string
  kind:        AlertKind
  severity:    AlertSeverity
  name:        string          // provider / merchant
  message:     string          // human-readable description
  action:      string          // suggested action text
  daysLeft?:   number
  amount?:     number
  source:      PaymentSource
  notified?:   boolean         // whether Gmail notification was sent
}

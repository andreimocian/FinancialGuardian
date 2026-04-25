
export type PaymentSource = 'transaction' | 'bill' | 'contract'

export type AggregatedPayment = {
  id:          string
  name:        string          
  amount:      number          
  category?:   string
  source:      PaymentSource
  currency:    string
  dueDate?:    string
  daysLeft?:   number
  paid?:       boolean
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


export type AlertSeverity = 'critical' | 'warning' | 'info'
export type AlertKind =
  | 'notice_deadline'       
  | 'bill_overdue'           
  | 'bill_due_soon'          
  | 'subscription_unused'    
  | 'contract_expiring'    

export type WatchdogAlert = {
  id:          string
  kind:        AlertKind
  severity:    AlertSeverity
  name:        string          
  message:     string          
  action:      string         
  daysLeft?:   number
  amount?:     number
  source:      PaymentSource
  notified?:   boolean         
}

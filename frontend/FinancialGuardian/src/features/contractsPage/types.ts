export type Contract = {
  _id:               string
  userId?:           string
  documentId?:       string
  provider:          string
  monthlyAmount:     number        // backend field name
  currency:          string
  startDate?:        string        // ISO
  endDate?:          string        // ISO
  noticePeriodDays?: number | null
  cancellationTerms?: string
  contractType?:     string        // not in backend — kept optional for display
  status?:           string        // 'active'
  autoRenew?:        boolean | null
  confidence?:       number
  description?:      string
  createdAt?:        string
  updatedAt?:        string
}

export type TimelineEvent = {
  _id:           string
  provider:      string
  monthlyAmount: number
  currency:      string
  eventDate:          string
  kind:          'notice' | 'end'
  daysUntil:      number
  description?:  string
}

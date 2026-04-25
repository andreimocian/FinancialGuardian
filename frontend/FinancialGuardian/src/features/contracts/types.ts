// ─── Obligation type — matches backend exactly ────────────────────────────────

export type ObligationType =
  | 'lease'
  | 'utility'
  | 'insurance'
  | 'subscription'
  | 'internet'
  | 'phone'
  | 'other'

export type UploadStatus =
  | 'idle'
  | 'uploading'
  | 'extracting'
  | 'done'
  | 'error'

export type ExtractionStatus =
  | 'idle'
  | 'streaming'
  | 'done'
  | 'error'

export type Confidence = 'high' | 'medium' | 'low'

// Matches the backend Obligation document
export type Obligation = {
  _id:         string
  userId?:     string
  provider:    string           // was: providerName
  amount:      number           // was: monthlyCost
  currency:    string
  dueDate:     string           // was: endDate — ISO string
  paid:        boolean
  paidAt?:     string | null
  description?: string

  // Agent-extracted fields — stored by frontend, may not persist to backend
  contractType?:       ObligationType
  startDate?:          string
  noticePeriodDays?:   number
  cancellationTerms?:  string
  confidence?:         Confidence
  fileName?:           string
}

export type FieldConfidence = {
  [K in keyof Obligation]?: Confidence
}

// ─── Agent SSE event types ────────────────────────────────────────────────────

export type AgentEvent =
  | { type: 'thinking'; message: string }
  | { type: 'field';    key: keyof Obligation; value: unknown; confidence: Confidence }
  | { type: 'done' }
  | { type: 'error';    message: string }

// ─── Upload file state ────────────────────────────────────────────────────────

export type UploadedFile = {
  id:       string
  file:     File
  status:   UploadStatus
  progress: number
  fileId?:  string
  result?:  Obligation
  error?:   string
}

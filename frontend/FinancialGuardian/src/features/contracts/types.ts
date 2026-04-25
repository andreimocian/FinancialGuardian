
export type ContractType =
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

export type ExtractedContract = {
  id: string
  fileName: string
  contractType: ContractType
  providerName: string
  startDate: string             // ISO string
  endDate: string               // ISO string
  noticePeriodDays: number
  monthlyCost: number
  currency: string
  cancellationTerms: string
  rawText?: string
  confidence: Confidence        // overall confidence
  savedAt?: string
}

export type FieldConfidence = {
  [K in keyof ExtractedContract]?: Confidence
}


export type AgentEvent =
  | { type: 'thinking'; message: string }
  | { type: 'field';    key: keyof ExtractedContract; value: unknown; confidence: Confidence }
  | { type: 'done' }
  | { type: 'error';    message: string }


export type UploadedFile = {
  id: string                    // local uuid
  file: File
  status: UploadStatus
  progress: number              // 0–100
  fileId?: string               // returned by backend after upload
  result?: ExtractedContract
  error?: string
}

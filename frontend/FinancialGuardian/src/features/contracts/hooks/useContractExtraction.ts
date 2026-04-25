import { useState, useEffect, useRef, useCallback } from 'react'
import type { Obligation, ExtractionStatus, Confidence, AgentEvent, FieldConfidence } from '../types'

type FieldKey = keyof Obligation

interface UseContractExtractionReturn {
  fields:      Partial<Obligation>
  fieldOrder:  FieldKey[]
  confidences: FieldConfidence
  thinking:    string | null
  status:      ExtractionStatus
  error:       string | null
  startStream: (fileId: string) => void
  reset:       () => void
}

const MOCK_EVENTS: AgentEvent[] = [
  { type: 'thinking', message: 'Reading contract header…' },
  { type: 'field',    key: 'provider',         value: 'Vodafone',   confidence: 'high' },
  { type: 'thinking', message: 'Scanning for contract dates…' },
  { type: 'field',    key: 'dueDate',           value: '2025-06-01', confidence: 'medium' },
  { type: 'thinking', message: 'Looking for notice period clause…' },
  { type: 'field',    key: 'noticePeriodDays',  value: 30,           confidence: 'high' },
  { type: 'field',    key: 'amount',            value: 49.99,        confidence: 'high' },
  { type: 'field',    key: 'contractType',      value: 'internet',   confidence: 'high' },
  { type: 'thinking', message: 'Extracting cancellation terms…' },
  { type: 'field',    key: 'cancellationTerms', value: 'Must notify in writing 30 days prior to end date.', confidence: 'medium' },
  { type: 'done' },
]

export function useContractExtraction(): UseContractExtractionReturn {
  const [fields,      setFields]      = useState<Partial<Obligation>>({})
  const [fieldOrder,  setFieldOrder]  = useState<FieldKey[]>([])
  const [confidences, setConfidences] = useState<FieldConfidence>({})
  const [thinking,    setThinking]    = useState<string | null>(null)
  const [status,      setStatus]      = useState<ExtractionStatus>('idle')
  const [error,       setError]       = useState<string | null>(null)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const closeStream = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => () => closeStream(), [closeStream])

  const processEvent = useCallback((event: AgentEvent, onDone: () => void) => {
    switch (event.type) {
      case 'thinking':
        setThinking(event.message)
        break
      case 'field': {
        const key = event.key as FieldKey
        setFields(prev => ({ ...prev, [key]: event.value }))
        setFieldOrder(prev => prev.includes(key) ? prev : [...prev, key])
        setConfidences(prev => ({ ...prev, [key]: event.confidence as Confidence }))
        setThinking(null)
        break
      }
      case 'done':
        setThinking(null)
        setStatus('done')
        onDone()
        break
      case 'error':
        setError(event.message)
        setStatus('error')
        onDone()
        break
    }
  }, [])

  // _fileId is unused — backend handles extraction during upload, no real SSE
  const startStream = useCallback((_fileId: string) => {
    closeStream()
    setFields({})
    setFieldOrder([])
    setConfidences({})
    setThinking(null)
    setError(null)
    setStatus('streaming')

    let i = 0
    intervalRef.current = setInterval(() => {
      if (i >= MOCK_EVENTS.length) {
        closeStream()
        return
      }
      processEvent(MOCK_EVENTS[i++], closeStream)
    }, 700)
  }, [closeStream, processEvent])

  const reset = useCallback(() => {
    closeStream()
    setFields({})
    setFieldOrder([])
    setConfidences({})
    setThinking(null)
    setStatus('idle')
    setError(null)
  }, [closeStream])

  return { fields, fieldOrder, confidences, thinking, status, error, startStream, reset }
}

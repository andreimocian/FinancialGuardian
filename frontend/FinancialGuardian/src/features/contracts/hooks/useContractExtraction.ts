import { useState, useEffect, useRef, useCallback } from 'react'
import { contractApi } from '../api'
import type { ExtractedContract, ExtractionStatus, Confidence, AgentEvent, FieldConfidence } from '../types'

type FieldKey = keyof ExtractedContract

interface UseContractExtractionReturn {
  fields:       Partial<ExtractedContract>
  fieldOrder:   FieldKey[]
  confidences:  FieldConfidence
  thinking:     string | null
  status:       ExtractionStatus
  error:        string | null
  startStream:  (fileId: string) => void
  reset:        () => void
}

// ─── Set to true to test UI without a backend ─────────────────────────────────
const USE_MOCK = true

const MOCK_EVENTS: AgentEvent[] = [
  { type: 'thinking',  message: 'Reading contract header…' },
  { type: 'field',     key: 'providerName',     value: 'Vodafone',    confidence: 'high' },
  { type: 'thinking',  message: 'Scanning for contract dates…' },
  { type: 'field',     key: 'startDate',        value: '2024-01-01',  confidence: 'high' },
  { type: 'field',     key: 'endDate',          value: '2025-06-01',  confidence: 'medium' },
  { type: 'thinking',  message: 'Looking for notice period clause…' },
  { type: 'field',     key: 'noticePeriodDays', value: 30,            confidence: 'high' },
  { type: 'field',     key: 'monthlyCost',      value: 49.99,         confidence: 'high' },
  { type: 'field',     key: 'contractType',     value: 'internet',    confidence: 'high' },
  { type: 'thinking',  message: 'Extracting cancellation terms…' },
  { type: 'field',     key: 'cancellationTerms', value: 'Must notify in writing 30 days prior to end date.', confidence: 'medium' },
  { type: 'done' },
]

export function useContractExtraction(): UseContractExtractionReturn {
  const [fields,      setFields]      = useState<Partial<ExtractedContract>>({})
  const [fieldOrder,  setFieldOrder]  = useState<FieldKey[]>([])
  const [confidences, setConfidences] = useState<FieldConfidence>({})
  const [thinking,    setThinking]    = useState<string | null>(null)
  const [status,      setStatus]      = useState<ExtractionStatus>('idle')
  const [error,       setError]       = useState<string | null>(null)

  const esRef       = useRef<EventSource | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Cleanup ───────────────────────────────────────────────────────────────
  const closeStream = useCallback(() => {
    esRef.current?.close()
    esRef.current = null
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => () => closeStream(), [closeStream])

  // ── Shared event processor (used by both mock and real SSE) ───────────────
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

  // ── Mock stream ───────────────────────────────────────────────────────────
  const startMockStream = useCallback(() => {
    let i = 0
    intervalRef.current = setInterval(() => {
      if (i >= MOCK_EVENTS.length) {
        clearInterval(intervalRef.current!)
        intervalRef.current = null
        return
      }
      processEvent(MOCK_EVENTS[i++], () => {
        clearInterval(intervalRef.current!)
        intervalRef.current = null
      })
    }, 700)
  }, [processEvent])

  // ── Real SSE stream ───────────────────────────────────────────────────────
  const startRealStream = useCallback((fileId: string) => {
    const es = contractApi.getExtractionStream(fileId)
    esRef.current = es

    es.onmessage = (e: MessageEvent) => {
      try {
        const event: AgentEvent = JSON.parse(e.data)
        processEvent(event, closeStream)
      } catch {
        // ignore malformed events
      }
    }

    es.onerror = () => {
      setStatus(prev => prev === 'done' ? 'done' : 'error')
      setError(prev => prev ?? 'Connection to agent lost')
      closeStream()
    }
  }, [processEvent, closeStream])

  // ── Public startStream ────────────────────────────────────────────────────
  const startStream = useCallback((fileId: string) => {
    closeStream()
    setFields({})
    setFieldOrder([])
    setConfidences({})
    setThinking(null)
    setError(null)
    setStatus('streaming')

    if (USE_MOCK) {
      startMockStream()
    } else {
      startRealStream(fileId)
    }
  }, [closeStream, startMockStream, startRealStream])

  // ── Reset ─────────────────────────────────────────────────────────────────
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

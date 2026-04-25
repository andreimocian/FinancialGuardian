import { useState, useCallback } from 'react'
import { contractApi } from '../api'
import type { Obligation, UploadedFile } from '../types'

const ACCEPTED_TYPES = ['application/pdf', 'application/zip', 'application/x-zip-compressed']
const MAX_SIZE_MB = 20

// Default type sent alongside the file — user can change this via a selector
// in the UI if needed. The Postman collection shows 'utility' as the example.
export const OBLIGATION_TYPES = [
  'utility',
  'lease',
  'insurance',
  'subscription',
  'internet',
  'phone',
  'other',
] as const

export type ObligationTypeOption = typeof OBLIGATION_TYPES[number]

function uid() {
  return Math.random().toString(36).slice(2)
}

function validate(file: File): string | null {
  const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf')
  const isZip = file.type === 'application/zip' ||
    file.type === 'application/x-zip-compressed' ||
    file.name.endsWith('.zip')

  if (!isPdf && !isZip) return 'Only PDF and ZIP files are accepted'
  if (file.size > MAX_SIZE_MB * 1024 * 1024) return `File exceeds ${MAX_SIZE_MB}MB limit`
  return null
}

export function useFileUpload() {
  const [files,        setFiles]        = useState<UploadedFile[]>([])
  const [defaultType,  setDefaultType]  = useState<ObligationTypeOption>('utility')

  const updateFile = useCallback((id: string, patch: Partial<UploadedFile>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f))
  }, [])

  const addFiles = useCallback((incoming: File[]) => {
    const entries: UploadedFile[] = incoming.map(file => {
      const error = validate(file) ?? undefined
      return { id: uid(), file, status: error ? 'error' : 'idle', progress: 0, error }
    })
    setFiles(prev => [...prev, ...entries])
  }, [])

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }, [])

  // Upload all idle files to POST /api/documents
  // Backend runs the AI agent and returns the obligation directly — no SSE needed
  const uploadAll = useCallback(async () => {
    const idle = files.filter(f => f.status === 'idle')

    await Promise.allSettled(
      idle.map(async (entry) => {
        updateFile(entry.id, { status: 'uploading', progress: 0 })

        try {
          // Show extracting state while waiting for backend AI response
          updateFile(entry.id, { status: 'extracting', progress: 100 })

          const res = await contractApi.upload(
            entry.file,
            defaultType,
            (pct) => updateFile(entry.id, { progress: pct }),
          )

          // Backend returns the created obligation directly
          updateFile(entry.id, {
            status: 'done',
            result: res.obligation as Obligation,
          })
        } catch (err: any) {
          updateFile(entry.id, { status: 'error', error: err.message })
        }
      }),
    )
  }, [files, updateFile, defaultType])

  const clearAll = useCallback(() => setFiles([]), [])

  const hasIdle      = files.some(f => f.status === 'idle')
  const isUploading  = files.some(f => f.status === 'uploading')
  const isExtracting = files.some(f => f.status === 'extracting')
  const allDone      = files.length > 0 && files.every(f => f.status === 'done' || f.status === 'error')

  return {
    files,
    defaultType,
    setDefaultType,
    addFiles,
    removeFile,
    uploadAll,
    clearAll,
    hasIdle,
    isUploading,
    isExtracting,
    allDone,
  }
}

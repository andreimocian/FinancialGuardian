import { useState, useCallback } from 'react'
import { contractApi } from '../api'
import type { UploadedFile } from '../types'

const ACCEPTED_TYPES = ['application/pdf', 'application/zip', 'application/x-zip-compressed']
const MAX_SIZE_MB = 20

function uid() {
  return Math.random().toString(36).slice(2)
}

function validate(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.zip')) {
    return 'Only PDF and ZIP files are accepted'
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return `File exceeds ${MAX_SIZE_MB}MB limit`
  }
  return null
}

export function useFileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([])

  // ── Update a single file entry by id ──────────────────────────────────────
  const updateFile = useCallback((id: string, patch: Partial<UploadedFile>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f))
  }, [])

  // ── Add files to queue (validation happens here) ───────────────────────────
  const addFiles = useCallback((incoming: File[]) => {
    const entries: UploadedFile[] = incoming.map(file => {
      const error = validate(file) ?? undefined
      return {
        id:       uid(),
        file,
        status:   error ? 'error' : 'idle',
        progress: 0,
        error,
      }
    })
    setFiles(prev => [...prev, ...entries])
  }, [])

  // ── Remove a file from the queue ───────────────────────────────────────────
  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }, [])

  // ── Upload all idle files ──────────────────────────────────────────────────
  const uploadAll = useCallback(async () => {
    const idle = files.filter(f => f.status === 'idle')

    await Promise.allSettled(
      idle.map(async (entry) => {
        updateFile(entry.id, { status: 'uploading', progress: 0 })

        try {
          const { fileId } = await contractApi.upload(
            entry.file,
            (pct) => updateFile(entry.id, { progress: pct }),
          )
          // Hand off to extraction — status becomes 'extracting'
          updateFile(entry.id, { status: 'extracting', progress: 100, fileId })
        } catch (err: any) {
          updateFile(entry.id, { status: 'error', error: err.message })
        }
      }),
    )
  }, [files, updateFile])

  // ── Mark a file as done with extraction result ─────────────────────────────
  const markDone = useCallback((id: string, result: UploadedFile['result']) => {
    updateFile(id, { status: 'done', result })
  }, [updateFile])

  const markError = useCallback((id: string, error: string) => {
    updateFile(id, { status: 'error', error })
  }, [updateFile])

  const clearAll = useCallback(() => setFiles([]), [])

  const hasIdle      = files.some(f => f.status === 'idle')
  const isUploading  = files.some(f => f.status === 'uploading')
  const isExtracting = files.some(f => f.status === 'extracting')
  const allDone      = files.length > 0 && files.every(f => f.status === 'done' || f.status === 'error')

  return {
    files,
    addFiles,
    removeFile,
    uploadAll,
    markDone,
    markError,
    clearAll,
    hasIdle,
    isUploading,
    isExtracting,
    allDone,
  }
}

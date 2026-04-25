import { useState, useCallback } from 'react'
import { contractsApi } from '../api'
import type { Contract } from '../types'

type UploadStatus = 'idle' | 'uploading' | 'extracting' | 'done' | 'error'

export type UploadedContractFile = {
  id:       string
  file:     File
  status:   UploadStatus
  progress: number
  result?:  Contract
  error?:   string
}

function uid() {
  return Math.random().toString(36).slice(2)
}

function validate(file: File): string | null {
  const ok = file.name.endsWith('.pdf') || file.name.endsWith('.zip')
  if (!ok) return 'Only PDF and ZIP files are accepted'
  if (file.size > 20 * 1024 * 1024) return 'File exceeds 20MB limit'
  return null
}

export function useContractUpload() {
  const [files, setFiles] = useState<UploadedContractFile[]>([])

  const update = useCallback((id: string, patch: Partial<UploadedContractFile>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f))
  }, [])

  const addFiles = useCallback((incoming: File[]) => {
    const entries = incoming.map(file => {
      const error = validate(file) ?? undefined
      return { id: uid(), file, status: (error ? 'error' : 'idle') as UploadStatus, progress: 0, error }
    })
    setFiles(prev => [...prev, ...entries])
  }, [])

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }, [])

  const uploadAll = useCallback(async () => {
    const idle = files.filter(f => f.status === 'idle')

    await Promise.allSettled(
      idle.map(async (entry) => {
        update(entry.id, { status: 'uploading', progress: 0 })
        try {
          update(entry.id, { status: 'extracting', progress: 100 })
          const res = await contractsApi.upload(
            entry.file,
            (pct) => update(entry.id, { progress: pct }),
          )
          update(entry.id, { status: 'done', result: res.contract })
        } catch (err: any) {
          update(entry.id, { status: 'error', error: err.message })
        }
      })
    )
  }, [files, update])

  const clearAll = useCallback(() => setFiles([]), [])

  const hasIdle      = files.some(f => f.status === 'idle')
  const isUploading  = files.some(f => f.status === 'uploading')
  const isExtracting = files.some(f => f.status === 'extracting')
  const allDone      = files.length > 0 && files.every(f => f.status === 'done' || f.status === 'error')

  return { files, addFiles, removeFile, uploadAll, clearAll, hasIdle, isUploading, isExtracting, allDone }
}

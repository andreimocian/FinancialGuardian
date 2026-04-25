import { motion, AnimatePresence } from 'framer-motion'
import type { UploadedFile } from '../types'

interface UploadProgressProps {
  files: UploadedFile[]
  onRemove: (id: string) => void
}

function StatusIcon({ status }: { status: UploadedFile['status'] }) {
  if (status === 'done') {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8l4 4 6-7" />
      </svg>
    )
  }
  if (status === 'error') {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#fb7185" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="8" cy="8" r="6" /><path d="M8 5v3M8 11h.01" />
      </svg>
    )
  }
  if (status === 'extracting') {
    return (
      <div className="flex gap-[3px] items-center">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-[4px] h-[4px] rounded-full bg-teal-400"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
      <path d="M14 2H6a2 2 0 00-2 2v16" /><path d="M14 2v6h6" />
    </svg>
  )
}

function statusLabel(status: UploadedFile['status']): string {
  switch (status) {
    case 'idle':       return 'Queued'
    case 'uploading':  return 'Uploading…'
    case 'extracting': return 'Guardian is reading…'
    case 'done':       return 'Extracted'
    case 'error':      return 'Failed'
  }
}

export function UploadProgress({ files, onRemove }: UploadProgressProps) {
  if (files.length === 0) return null

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {files.map(f => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white/[0.04] border border-white/[0.07] rounded-xl overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0">
                <StatusIcon status={f.status} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-white/80 truncate">{f.file.name}</p>
                <p className={`text-[11px] mt-0.5 ${f.status === 'error' ? 'text-rose-400' : f.status === 'done' ? 'text-teal-400' : 'text-white/30'}`}>
                  {f.error ?? statusLabel(f.status)}
                </p>
              </div>

              <span className="text-[11px] text-white/25 shrink-0">
                {(f.file.size / 1024 / 1024).toFixed(1)} MB
              </span>

              {(f.status === 'idle' || f.status === 'error') && (
                <button
                  onClick={() => onRemove(f.id)}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M2 2l8 8M10 2l-8 8" />
                  </svg>
                </button>
              )}
            </div>

            {f.status === 'uploading' && (
              <div className="h-[2px] bg-white/[0.06] mx-4 mb-3 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-teal-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${f.progress}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
            )}

            {f.status === 'extracting' && (
              <div className="h-[2px] bg-white/[0.06] mx-4 mb-3 rounded-full overflow-hidden">
                <motion.div
                  className="h-full w-1/3 bg-teal-400/60 rounded-full"
                  animate={{ x: ['−100%', '400%'] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

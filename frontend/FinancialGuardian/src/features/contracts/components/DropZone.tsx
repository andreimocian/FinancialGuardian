import { useCallback, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface DropZoneProps {
  onFiles: (files: File[]) => void
  disabled?: boolean
}

export function DropZone({ onFiles, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback((raw: FileList | null) => {
    if (!raw) return
    onFiles(Array.from(raw))
  }, [onFiles])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }, [disabled])

  const onDragLeave = useCallback(() => setIsDragging(false), [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (!disabled) handleFiles(e.dataTransfer.files)
  }, [disabled, handleFiles])

  return (
    <motion.div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      animate={{
        borderColor: isDragging ? 'rgba(45,212,191,0.6)' : 'rgba(255,255,255,0.08)',
        backgroundColor: isDragging ? 'rgba(45,212,191,0.04)' : 'rgba(255,255,255,0.02)',
      }}
      transition={{ duration: 0.15 }}
      className="relative rounded-2xl border-2 border-dashed p-12 flex flex-col items-center justify-center gap-4 cursor-pointer select-none"
      style={{ minHeight: 220 }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.zip"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />

      {/* Icon */}
      <motion.div
        animate={{ scale: isDragging ? 1.12 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6M12 18v-6M9 15l3-3 3 3" />
        </svg>
      </motion.div>

      {/* Text */}
      <div className="text-center">
        <AnimatePresence mode="wait">
          {isDragging ? (
            <motion.p
              key="drop"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-[15px] font-medium text-teal-400"
            >
              Drop to scan
            </motion.p>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              <p className="text-[15px] font-medium text-white/70">
                Drop contracts here
              </p>
              <p className="text-[13px] text-white/30 mt-1">
                PDF or ZIP · up to 20MB · lease, utility, insurance, subscription
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Browse link */}
      {!isDragging && (
        <span className="text-[13px] text-teal-400 hover:text-teal-300 transition-colors font-medium">
          or browse files
        </span>
      )}
    </motion.div>
  )
}

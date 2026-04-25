import { useState } from 'react'
import type { Obligation, Confidence } from '../types'
type FieldKey = keyof Obligation

interface ExtractionFieldProps {
  label:      string
  fieldKey:   FieldKey
  value:      unknown
  confidence: Confidence
  onChange:   (key: FieldKey, value: string) => void
}

const confidenceStyles: Record<Confidence, string> = {
  high:   'text-teal-400 bg-teal-500/10 border-teal-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  low:    'text-rose-400 bg-rose-500/10 border-rose-500/20',
}

export function ExtractionField({ label, fieldKey, value, confidence, onChange }: ExtractionFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(String(value ?? ''))

  const commit = () => {
    onChange(fieldKey, draft)
    setEditing(false)
  }

  const displayValue = String(value ?? '—')

  return (
    <div className="flex items-start justify-between gap-4 px-5 py-3.5 group hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
        <span className="text-[12px] text-white/40">{label}</span>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${confidenceStyles[confidence]}`}>
          {confidence}
        </span>
      </div>

      <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
        {editing ? (
          <div className="flex items-center gap-2 w-full justify-end">
            <input
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
              className="bg-white/[0.06] border border-teal-500/40 rounded-lg px-2.5 py-1 text-[13px] text-white/90 outline-none w-full max-w-[220px] text-right"
            />
            <button
              onMouseDown={commit}
              className="text-[11px] font-medium text-teal-400 hover:text-teal-300 shrink-0"
            >
              Save
            </button>
          </div>
        ) : (
          <>
            <span className="text-[13px] font-medium text-white/80 text-right">{displayValue}</span>
            <button
              onClick={() => { setDraft(displayValue); setEditing(true) }}
              className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] shrink-0"
              aria-label="Edit field"
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 1.5l2 2L4 10H2v-2L8.5 1.5z" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  )
}

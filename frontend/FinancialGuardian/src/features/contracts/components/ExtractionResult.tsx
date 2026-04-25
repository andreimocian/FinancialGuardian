import { useState } from 'react'
import { motion } from 'framer-motion'
import { ExtractionField } from './ExtractionField'
import type { ExtractedContract, FieldConfidence } from '../types'

type FieldKey = keyof ExtractedContract

const FIELD_LABELS: Partial<Record<FieldKey, string>> = {
  providerName:      'Provider',
  contractType:      'Contract type',
  startDate:         'Start date',
  endDate:           'End date',
  noticePeriodDays:  'Notice period',
  monthlyCost:       'Monthly cost',
  currency:          'Currency',
  cancellationTerms: 'Cancellation terms',
}

const DISPLAY_ORDER: FieldKey[] = [
  'providerName',
  'contractType',
  'monthlyCost',
  'currency',
  'startDate',
  'endDate',
  'noticePeriodDays',
  'cancellationTerms',
]

interface ExtractionResultProps {
  contract:    Partial<ExtractedContract>
  confidences: FieldConfidence
  fileName:    string
  onSave:      (contract: Partial<ExtractedContract>) => Promise<void>
  onDiscard:   () => void
}

export function ExtractionResult({
  contract: initial,
  confidences,
  fileName,
  onSave,
  onDiscard,
}: ExtractionResultProps) {
  const [fields,  setFields]  = useState<Partial<ExtractedContract>>(initial)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  const handleChange = (key: FieldKey, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(fields)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-teal-500/[0.07] border border-teal-500/20 rounded-2xl p-8 flex flex-col items-center gap-3 text-center"
      >
        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 10l5 5 7-8" />
          </svg>
        </div>
        <p className="text-[15px] font-medium text-white/85">Saved to timeline</p>
        <p className="text-[13px] text-white/35">{fields.providerName} contract added to your obligation timeline</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
        <div>
          <p className="text-[14px] font-medium text-white/85">Review extraction</p>
          <p className="text-[11px] text-white/30 mt-0.5 truncate max-w-[240px]">{fileName}</p>
        </div>
        <span className="text-[11px] text-white/30 bg-white/[0.05] border border-white/[0.08] px-2.5 py-1 rounded-full">
          Click any field to edit
        </span>
      </div>

      {/* Fields */}
      <div className="divide-y divide-white/[0.04]">
        {DISPLAY_ORDER.map(key => {
          const label = FIELD_LABELS[key]
          if (!label || !(key in fields)) return null
          return (
            <ExtractionField
              key={key}
              label={label}
              fieldKey={key}
              value={fields[key]}
              confidence={confidences[key] ?? 'medium'}
              onChange={handleChange}
            />
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 px-5 py-4 border-t border-white/[0.07]">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleSave}
          disabled={saving}
          className={`flex-1 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 ${
            saving
              ? 'bg-teal-500/30 text-teal-300/50 cursor-not-allowed'
              : 'bg-teal-500 text-white hover:bg-teal-400 shadow-lg shadow-teal-500/20'
          }`}
        >
          {saving ? 'Saving…' : 'Save to timeline'}
        </motion.button>

        <button
          onClick={onDiscard}
          className="px-4 py-2.5 rounded-xl text-[13.5px] text-white/40 border border-white/10 hover:border-white/20 hover:text-white/60 transition-all duration-150"
        >
          Discard
        </button>
      </div>
    </motion.div>
  )
}

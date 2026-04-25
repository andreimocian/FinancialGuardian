import { motion, AnimatePresence } from 'framer-motion'
import type { ExtractedContract, FieldConfidence, Confidence } from '../types'


const FIELD_LABELS: Partial<Record<keyof ExtractedContract, string>> = {
  providerName:      'Provider',
  contractType:      'Contract type',
  startDate:         'Start date',
  endDate:           'End date',
  noticePeriodDays:  'Notice period',
  monthlyCost:       'Monthly cost',
  currency:          'Currency',
  cancellationTerms: 'Cancellation terms',
}


function ConfidencePill({ confidence }: { confidence: Confidence }) {
  const styles: Record<Confidence, string> = {
    high:   'bg-teal-500/10 text-teal-400 border-teal-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low:    'bg-rose-500/10  text-rose-400  border-rose-500/20',
  }
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${styles[confidence]}`}>
      {confidence}
    </span>
  )
}


function formatValue(key: keyof ExtractedContract, value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (key === 'startDate' || key === 'endDate') {
    try {
      return new Date(value as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    } catch { return String(value) }
  }
  if (key === 'noticePeriodDays') return `${value} days`
  if (key === 'monthlyCost') return `€${Number(value).toFixed(2)}`
  return String(value)
}


function isUrgentNotice(key: keyof ExtractedContract, fields: Partial<ExtractedContract>): boolean {
  if (key !== 'noticePeriodDays' || !fields.endDate) return false
  const daysUntilEnd = Math.ceil(
    (new Date(fields.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  return daysUntilEnd <= (fields.noticePeriodDays ?? 0) + 7
}


interface AgentThinkingProps {
  thinking:    string | null
  fields:      Partial<ExtractedContract>
  fieldOrder:  Array<keyof ExtractedContract>
  confidences: FieldConfidence
  status:      'streaming' | 'done' | 'error' | 'idle'
  fileName?:   string
}


export function AgentThinking({
  thinking,
  fields,
  fieldOrder,
  confidences,
  status,
  fileName,
}: AgentThinkingProps) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">

      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round">
              <path d="M8 2l5 2v4c0 3-2.5 5-5 6C5.5 13 3 11 3 8V4l5-2z" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-medium text-white/85">Guardian</p>
            {fileName && (
              <p className="text-[11px] text-white/30 mt-0.5 truncate max-w-[200px]">{fileName}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {status === 'streaming' && (
            <>
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-teal-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <span className="text-[11px] text-teal-400 font-medium">Reading</span>
            </>
          )}
          {status === 'done' && (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              <span className="text-[11px] text-teal-400 font-medium">Complete</span>
            </>
          )}
          {status === 'error' && (
            <span className="text-[11px] text-rose-400 font-medium">Failed</span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {thinking && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-5 py-3 border-b border-white/[0.05] flex items-center gap-2.5"
          >
            <div className="flex gap-[3px] shrink-0">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-[4px] h-[4px] rounded-full bg-teal-400/60"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
                />
              ))}
            </div>
            <p className="text-[12.5px] text-white/40 italic">{thinking}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="divide-y divide-white/[0.04]">
        <AnimatePresence initial={false}>
          {fieldOrder.map(key => {
            const label = FIELD_LABELS[key]
            if (!label) return null
            const value      = fields[key]
            const confidence = confidences[key] ?? 'medium'
            const urgent     = isUrgentNotice(key, fields)

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className={`flex items-start justify-between gap-4 px-5 py-3.5 ${urgent ? 'bg-amber-500/[0.04]' : ''}`}
              >
                <div className="flex items-center gap-2 shrink-0">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                  <span className="text-[12px] text-white/40">{label}</span>
                </div>

                <div className="flex items-center gap-2 min-w-0">
                  {urgent && (
                    <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md shrink-0">
                      Act soon
                    </span>
                  )}
                  <span className="text-[13px] font-medium text-white/85 text-right">
                    {formatValue(key, value)}
                  </span>
                  <ConfidencePill confidence={confidence} />
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {status === 'streaming' && fieldOrder.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-5 py-3.5"
          >
            <div className="flex gap-[3px]">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-[4px] h-[4px] rounded-full bg-white/20"
                  animate={{ opacity: [0.2, 0.6, 0.2] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
            <span className="text-[12px] text-white/20">Extracting next field…</span>
          </motion.div>
        )}
      </div>

      {fieldOrder.length === 0 && status === 'streaming' && (
        <div className="px-5 py-8 flex flex-col items-center gap-3">
          <div className="flex gap-[5px]">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-[6px] h-[6px] rounded-full bg-teal-400"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.22 }}
              />
            ))}
          </div>
          <p className="text-[13px] text-white/30">Guardian is reading your contract…</p>
        </div>
      )}
    </div>
  )
}

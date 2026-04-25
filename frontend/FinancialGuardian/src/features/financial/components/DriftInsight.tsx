import { motion, AnimatePresence } from 'framer-motion'
import type { DriftResult } from '../hooks/useDriftDetection'

interface Props {
  drift: DriftResult
  loading?: boolean
}

const CATEGORY_EMOJI: Record<string, string> = {
  food:          '🍽',
  groceries:     '🛒',
  transport:     '🚌',
  entertainment: '🎬',
  health:        '💊',
  shopping:      '🛍',
  utilities:     '💡',
  travel:        '✈️',
  subscriptions: '📦',
  other:         '•',
}

function emojiFor(cat: string): string {
  return CATEGORY_EMOJI[cat?.toLowerCase()] ?? '•'
}

function driftMessage(cat: string, ratio: number, count: number, merchant?: string): string {
  const times = ratio.toFixed(1)
  const base  = merchant
    ? `${count}× ${merchant} this week`
    : `${times}× usual ${cat} spend`

  return `${base} — everything okay?`
}

export function DriftInsight({ drift, loading }: Props) {
  // Show loading shimmer
  if (loading) {
    return (
      <div className="bg-teal-500/[0.07] border border-teal-500/20 rounded-2xl p-5 animate-pulse">
        <div className="w-16 h-2.5 rounded-full bg-teal-500/20 mb-3" />
        <div className="w-full h-3 rounded-full bg-white/[0.06] mb-2" />
        <div className="w-2/3 h-3 rounded-full bg-white/[0.04]" />
      </div>
    )
  }

  if (drift.isClean) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-teal-500/[0.07] border border-teal-500/20 rounded-2xl p-5"
      >
        <div className="flex items-center gap-1.5 mb-2">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round">
            <path d="M8 2l5 2v4c0 3-2.5 5-5 6C5.5 13 3 11 3 8V4l5-2z" />
          </svg>
          <span className="text-[11px] font-medium text-teal-400 uppercase tracking-wider">Guardian</span>
        </div>
        <p className="text-[12.5px] text-white/55 leading-relaxed italic">
          "Your spending is within baseline. No unusual patterns detected this week."
        </p>
      </motion.div>
    )
  }

  const [top, ...rest] = drift.events

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {/* Primary drift card */}
        <motion.div
          key={top.category}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`rounded-2xl p-5 border-l-[3px] ${
            top.severity === 'high'
              ? 'bg-amber-500/[0.06] border-l-amber-400 border border-amber-500/15'
              : 'bg-white/[0.04] border-l-amber-400/50 border border-white/[0.07]'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round">
              <path d="M8 2l5 2v4c0 3-2.5 5-5 6C5.5 13 3 11 3 8V4l5-2z" />
            </svg>
            <span className="text-[11px] font-medium text-teal-400 uppercase tracking-wider">Guardian</span>
          </div>

          <p className={`text-[13.5px] font-medium mb-1 ${
            top.severity === 'high' ? 'text-amber-300' : 'text-white/80'
          }`}>
            {emojiFor(top.category)} {driftMessage(top.category, top.ratio, top.count, top.topMerchant)}
          </p>

          <p className="text-[11.5px] text-white/35 leading-relaxed">
            €{top.current.toFixed(2)} this week vs €{top.baseline.toFixed(2)} usual
            · {top.ratio.toFixed(1)}× baseline
          </p>
        </motion.div>

        {/* Secondary drifts — compact */}
        {rest.slice(0, 2).map((event, i) => (
          <motion.div
            key={event.category}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (i + 1) * 0.06, duration: 0.25 }}
            className="flex items-center gap-3 px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl"
          >
            <span className="text-[14px]">{emojiFor(event.category)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-white/60 truncate capitalize">
                {event.category} — {event.ratio.toFixed(1)}× usual
              </p>
            </div>
            <span className="text-[11px] font-mono text-amber-400/70 shrink-0">
              €{event.current.toFixed(2)}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

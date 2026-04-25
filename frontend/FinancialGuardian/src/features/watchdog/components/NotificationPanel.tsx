import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { WatchdogAlert, AlertSeverity, PaymentSource } from '../types'

const SOURCE_LABEL: Record<PaymentSource, string> = {
  transaction: 'Transaction',
  bill:        'Bill',
  contract:    'Contract',
}

const SEVERITY_STYLES: Record<AlertSeverity, { dot: string }> = {
  critical: { dot: 'bg-rose-400 shadow-lg shadow-rose-500/40' },
  warning:  { dot: 'bg-amber-400' },
  info:     { dot: 'bg-white/30' },
}

const NOTIFICATION_RULES = [
  { icon: '📅', channel: 'Gmail',    title: 'Bill due soon',            desc: 'Email 7 days and 1 day before a bill is due',                  source: 'bill'     as PaymentSource },
  { icon: '📅', channel: 'Calendar', title: 'Bill due soon',            desc: 'Calendar event with popup reminder added on due date',          source: 'bill'     as PaymentSource },
  { icon: '⚠️', channel: 'Gmail',    title: 'Bill overdue',             desc: 'Immediate email when a bill passes its due date unpaid',        source: 'bill'     as PaymentSource },
  { icon: '⚠️', channel: 'Calendar', title: 'Bill overdue',             desc: 'Overdue event added to calendar with urgent reminder',          source: 'bill'     as PaymentSource },
  { icon: '📋', channel: 'Gmail',    title: 'Contract notice deadline', desc: '30-day and 7-day warning before notice period closes',          source: 'contract' as PaymentSource },
  { icon: '📋', channel: 'Calendar', title: 'Contract notice deadline', desc: 'Calendar event marking the last day to give notice',            source: 'contract' as PaymentSource },
  { icon: '🔚', channel: 'Gmail',    title: 'Contract expiring',        desc: '60-day heads-up before a contract end date',                   source: 'contract' as PaymentSource },
  { icon: '🔚', channel: 'Calendar', title: 'Contract expiring',        desc: 'Contract end date added as a calendar event',                  source: 'contract' as PaymentSource },
]
const CHANNEL_STYLE: Record<string, string> = {
  Gmail:    'bg-rose-500/10 border-rose-500/20 text-rose-400',
  Calendar: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
}

interface NotificationPanelProps {
  alerts: WatchdogAlert[]
}

export function NotificationPanel({ alerts }: NotificationPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const wouldFire = alerts.filter(a => a.severity === 'critical' || a.severity === 'warning')

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.4 }}
      className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Icons */}
          <div className="flex items-center gap-1.5">
            {/* Gmail icon */}
            <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
              <svg width="15" height="11" viewBox="0 0 20 15" fill="none">
                <rect x="0.5" y="0.5" width="19" height="14" rx="1.5" fill="none" stroke="rgba(255,255,255,0.15)" />
                <path d="M0 2l10 7 10-7" stroke="#EA4335" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            {/* Calendar icon */}
            <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#4285F4" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="2" width="14" height="13" rx="2" />
                <path d="M1 6h14M5 1v2M11 1v2" />
                <rect x="4" y="9" width="3" height="3" rx="0.5" fill="#4285F4" stroke="none" />
              </svg>
            </div>
          </div>

          <div className="text-left">
            <p className="text-[14px] font-medium text-white/85">Gmail + Calendar notifications</p>
            <p className="text-[12px] text-white/30 mt-0.5">
              {wouldFire.length > 0
                ? `${wouldFire.length} notification${wouldFire.length > 1 ? 's' : ''} would fire right now`
                : 'No urgent notifications at this time'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Active badge — Google already connected via login */}
          <span className="text-[10px] font-medium px-2 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
            Connected
          </span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 5l4 4 4-4" />
            </svg>
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-4 space-y-5 border-t border-white/[0.06]">

              {/* Would fire now */}
              {wouldFire.length > 0 && (
                <div>
                  <p className="text-[11px] text-white/30 uppercase tracking-wider mb-3">
                    Would send now ({wouldFire.length})
                  </p>
                  <div className="space-y-2">
                    {wouldFire.slice(0, 4).map(a => (
                      <div key={a.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${SEVERITY_STYLES[a.severity].dot}`} />
                        <p className="text-[12px] font-medium text-white/65 flex-1 truncate">{a.message}</p>
                        <div className="flex gap-1 shrink-0">
                          {/* Both Gmail + Calendar fire for every alert */}
                          <span className="text-[9px] px-1.5 py-0.5 rounded border bg-rose-500/10 border-rose-500/20 text-rose-400">Gmail</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded border bg-blue-500/10 border-blue-500/20 text-blue-400">Cal</span>
                        </div>
                      </div>
                    ))}
                    {wouldFire.length > 4 && (
                      <p className="text-[11px] text-white/25 pl-3">+{wouldFire.length - 4} more</p>
                    )}
                  </div>
                </div>
              )}

              {/* Notification rules */}
              <div>
                <p className="text-[11px] text-white/30 uppercase tracking-wider mb-3">Notification rules</p>
                <div className="space-y-2">
                  {NOTIFICATION_RULES.map((rule, i) => (
                    <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                      <span className="text-[15px] shrink-0 mt-0.5">{rule.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-medium text-white/60">{rule.title}</p>
                        <p className="text-[11px] text-white/30 mt-0.5">{rule.desc}</p>
                      </div>
                      <div className="flex flex-col gap-1 items-end shrink-0">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${CHANNEL_STYLE[rule.channel]}`}>
                          {rule.channel}
                        </span>
                        <span className="text-[10px] text-white/20 capitalize">{rule.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

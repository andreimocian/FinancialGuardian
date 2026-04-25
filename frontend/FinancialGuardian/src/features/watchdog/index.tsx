import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWatchdog } from './hooks/useWatchdog'
import type { CategoryBreakdown, AggregatedPayment, WatchdogAlert, AlertSeverity, PaymentSource } from './types'

// ─── Constants ────────────────────────────────────────────────────────────────

const SOURCE_LABEL: Record<PaymentSource, string> = {
  transaction: 'Transaction',
  bill:        'Bill',
  contract:    'Contract',
}

const SOURCE_COLOR: Record<PaymentSource, string> = {
  transaction: '#2dd4bf',
  bill:        '#f59e0b',
  contract:    '#818cf8',
}

const SEVERITY_STYLES: Record<AlertSeverity, { card: string; dot: string; badge: string }> = {
  critical: {
    card:  'border-rose-500/20 bg-rose-500/[0.05]',
    dot:   'bg-rose-400 shadow-lg shadow-rose-500/40',
    badge: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
  },
  warning: {
    card:  'border-amber-500/20 bg-amber-500/[0.04]',
    dot:   'bg-amber-400',
    badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  },
  info: {
    card:  'border-white/[0.07] bg-white/[0.03]',
    dot:   'bg-white/30',
    badge: 'bg-white/[0.06] border-white/10 text-white/40',
  },
}

// ─── Donut chart ──────────────────────────────────────────────────────────────

function DonutChart({ breakdown, total }: { breakdown: CategoryBreakdown[]; total: number }) {
  const [hovered, setHovered] = useState<string | null>(null)
  const R = 80; const CX = 110; const CY = 110
  const gap = 1.5
  let cumAngle = -90

  const segments = breakdown.map(cat => {
    const fraction  = total > 0 ? cat.amount / total : 0
    const angleDeg  = fraction * 360 - gap
    const start     = cumAngle
    cumAngle += fraction * 360

    const toRad = (deg: number) => (deg * Math.PI) / 180
    const x1 = CX + R * Math.cos(toRad(start))
    const y1 = CY + R * Math.sin(toRad(start))
    const x2 = CX + R * Math.cos(toRad(start + angleDeg))
    const y2 = CY + R * Math.sin(toRad(start + angleDeg))
    const lg = angleDeg > 180 ? 1 : 0
    const d  = `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${lg} 1 ${x2} ${y2} Z`

    return { ...cat, d, fraction }
  })

  const hoveredCat = hovered ? breakdown.find(b => b.category === hovered) : null

  return (
    <div className="flex items-center gap-8 flex-wrap">
      <div className="relative shrink-0">
        <svg width={CX * 2} height={CY * 2} viewBox={`0 0 ${CX * 2} ${CY * 2}`}>
          {segments.map(seg => (
            <motion.path
              key={seg.category}
              d={seg.d}
              fill={seg.color}
              animate={{ opacity: hovered && hovered !== seg.category ? 0.2 : 1 }}
              transition={{ duration: 0.15 }}
              onMouseEnter={() => setHovered(seg.category)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            />
          ))}
          <circle cx={CX} cy={CY} r={R * 0.56} fill="#0c0c0f" />
          <text x={CX} y={CY - 9} textAnchor="middle" fill="rgba(255,255,255,0.85)"
            fontSize="15" fontWeight="600" fontFamily="monospace">
            €{hoveredCat ? hoveredCat.amount.toFixed(0) : total.toFixed(0)}
          </text>
          <text x={CX} y={CY + 10} textAnchor="middle" fill="rgba(255,255,255,0.28)" fontSize="10">
            {hoveredCat ? hoveredCat.category : 'total / mo'}
          </text>
          {hoveredCat && (
            <text x={CX} y={CY + 24} textAnchor="middle" fill="rgba(255,255,255,0.18)" fontSize="9">
              {((hoveredCat.amount / total) * 100).toFixed(1)}% of total
            </text>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 flex-1 min-w-[160px]">
        {breakdown.slice(0, 9).map(cat => (
          <motion.div
            key={cat.category}
            onMouseEnter={() => setHovered(cat.category)}
            onMouseLeave={() => setHovered(null)}
            animate={{ opacity: hovered && hovered !== cat.category ? 0.35 : 1 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2.5 cursor-default"
          >
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
            <span className="text-[12px] text-white/50 capitalize truncate flex-1">{cat.category}</span>
            <span className="text-[12px] font-mono text-white/65 shrink-0">€{cat.amount.toFixed(2)}</span>
            <span className="text-[10px] text-white/22 w-7 text-right shrink-0">
              {total > 0 ? ((cat.amount / total) * 100).toFixed(0) : 0}%
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Ranked payment row ───────────────────────────────────────────────────────

function PaymentRow({ payment, index, maxAmount }: { payment: AggregatedPayment; index: number; maxAmount: number }) {
  const pct   = maxAmount > 0 ? (payment.amount / maxAmount) * 100 : 0
  const color = SOURCE_COLOR[payment.source]

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="flex items-center gap-3"
    >
      <span className="text-[11px] text-white/18 w-4 text-right shrink-0 font-mono tabular-nums">{index + 1}</span>

      <div className="w-28 shrink-0 min-w-0">
        <p className="text-[12.5px] font-medium text-white/72 truncate">{payment.name}</p>
        <p className="text-[10px] mt-0.5" style={{ color: `${color}88` }}>
          {SOURCE_LABEL[payment.source]}
        </p>
      </div>

      <div className="flex-1 h-5 bg-white/[0.04] rounded-lg overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.2 + index * 0.04, duration: 0.55, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
          className="absolute inset-y-0 left-0 rounded-lg"
          style={{ backgroundColor: `${color}18`, borderRight: `2px solid ${color}55` }}
        />
      </div>

      <span className="text-[12.5px] font-mono font-medium w-18 text-right shrink-0" style={{ color }}>
        €{payment.amount.toFixed(2)}
      </span>
    </motion.div>
  )
}

// ─── Alert card ───────────────────────────────────────────────────────────────

function AlertCard({ alert, index }: { alert: WatchdogAlert; index: number }) {
  const styles = SEVERITY_STYLES[alert.severity]

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`flex items-start gap-3 p-4 rounded-xl border ${styles.card}`}
    >
      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${styles.dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-[13px] font-medium text-white/80">{alert.name}</p>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border shrink-0 ${styles.badge}`}>
            {SOURCE_LABEL[alert.source]}
          </span>
        </div>
        <p className="text-[12px] text-white/45 leading-relaxed">{alert.message}</p>
        <p className="text-[11px] text-white/22 mt-1">→ {alert.action}</p>
      </div>
      {alert.amount !== undefined && (
        <div className="text-right shrink-0">
          <p className="text-[13px] font-mono font-medium text-white/55">€{alert.amount.toFixed(2)}</p>
          <p className="text-[10px] text-white/22">/mo</p>
        </div>
      )}
    </motion.div>
  )
}

// ─── Gmail panel ──────────────────────────────────────────────────────────────

function GmailPanel({ alerts }: { alerts: WatchdogAlert[] }) {
  const [expanded, setExpanded] = useState(false)
  const wouldFire = alerts.filter(a => a.severity === 'critical' || a.severity === 'warning')

  const GMAIL_RULES = [
    {
      icon: '📅',
      title: 'Bill due soon',
      desc: 'Email 7 days and 1 day before a bill is due',
      source: 'bill' as PaymentSource,
    },
    {
      icon: '⚠️',
      title: 'Bill overdue',
      desc: 'Immediate email when a bill passes its due date unpaid',
      source: 'bill' as PaymentSource,
    },
    {
      icon: '📋',
      title: 'Contract notice deadline',
      desc: '30-day and 7-day warning before notice period closes',
      source: 'contract' as PaymentSource,
    },
    {
      icon: '🔚',
      title: 'Contract expiring',
      desc: '60-day heads-up before a contract end date',
      source: 'contract' as PaymentSource,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.4 }}
      className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
            <svg width="15" height="11" viewBox="0 0 20 15" fill="none">
              <rect x="0.5" y="0.5" width="19" height="14" rx="1.5" fill="none" stroke="rgba(255,255,255,0.15)" />
              <path d="M0 2l10 7 10-7" stroke="#EA4335" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-[14px] font-medium text-white/85">Gmail notifications</p>
            <p className="text-[12px] text-white/30 mt-0.5">
              {wouldFire.length > 0
                ? `${wouldFire.length} notification${wouldFire.length > 1 ? 's' : ''} would send right now`
                : 'No urgent notifications at this time'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-medium px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            Coming soon
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

              {/* Preview — what would fire now */}
              {wouldFire.length > 0 && (
                <div>
                  <p className="text-[11px] text-white/30 uppercase tracking-wider mb-3">
                    Would send now ({wouldFire.length})
                  </p>
                  <div className="space-y-2">
                    {wouldFire.slice(0, 4).map((a, i) => (
                      <div key={a.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${SEVERITY_STYLES[a.severity].dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-white/65 truncate">{a.message}</p>
                        </div>
                        <span className="text-[10px] text-white/25 shrink-0">{SOURCE_LABEL[a.source]}</span>
                      </div>
                    ))}
                    {wouldFire.length > 4 && (
                      <p className="text-[11px] text-white/25 pl-3">+{wouldFire.length - 4} more</p>
                    )}
                  </div>
                </div>
              )}

              {/* Rules */}
              <div>
                <p className="text-[11px] text-white/30 uppercase tracking-wider mb-3">Notification rules</p>
                <div className="space-y-2">
                  {GMAIL_RULES.map(rule => (
                    <div key={rule.title} className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                      <span className="text-[15px] shrink-0 mt-0.5">{rule.icon}</span>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium text-white/60">{rule.title}</p>
                        <p className="text-[11px] text-white/30 mt-0.5">{rule.desc}</p>
                      </div>
                      <span className="text-[10px] text-white/20 shrink-0 mt-1 capitalize">{rule.source}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* OAuth CTA */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/[0.07] border border-indigo-500/20">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="6" />
                  <path d="M8 5v3l2 2" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-indigo-300">Gmail OAuth required</p>
                  <p className="text-[11px] text-indigo-400/50 mt-0.5">Connect your Google account to enable email notifications</p>
                </div>
                <button className="text-[11px] font-medium text-indigo-400 border border-indigo-500/30 px-2.5 py-1.5 rounded-lg hover:bg-indigo-500/10 transition-colors shrink-0">
                  Connect
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="h-64 rounded-2xl bg-white/[0.03] animate-pulse" />
      <div className="h-48 rounded-2xl bg-white/[0.03] animate-pulse" />
    </div>
  )
}

// ─── Watchdog page ────────────────────────────────────────────────────────────

export default function Watchdog() {
  const { topPayments, breakdown, alerts, totalMonthly, loading, error } = useWatchdog()

  const maxAmount     = topPayments[0]?.amount ?? 1
  const criticalCount = alerts.filter(a => a.severity === 'critical').length

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white p-6 lg:p-8">

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-teal-500/4 blur-[140px]" />
        {criticalCount > 0 && (
          <div className="absolute top-1/3 right-1/4 w-[280px] h-[280px] rounded-full bg-rose-500/4 blur-[100px]" />
        )}
      </div>

      <div className="relative max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round">
                <path d="M8 2l5 2v4c0 3-2.5 5-5 6C5.5 13 3 11 3 8V4l5-2z" />
              </svg>
            </div>
            <span className="text-white/40 text-[12px] font-medium uppercase tracking-widest">Guardian</span>
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight">
            Watchdog<span className="text-teal-400">.</span>
          </h1>
          <p className="text-white/40 text-[13px] mt-0.5">
            Transactions and bills — what you're spending, what needs attention
          </p>
        </motion.div>

        {loading ? <Skeleton /> : error ? (
          <div className="bg-rose-500/[0.07] border border-rose-500/20 rounded-2xl p-6 text-center">
            <p className="text-[13px] text-rose-400">{error}</p>
          </div>
        ) : (
          <>
            {/* Summary strip */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
              className="grid grid-cols-3 gap-4"
            >
              <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4">
                <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1.5">Total spending</p>
                <p className="text-[22px] font-semibold font-mono text-teal-400">
                  €{totalMonthly.toFixed(2)}
                </p>
                <p className="text-[10px] text-white/20 mt-1">transactions + bills</p>
              </div>
              <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4">
                <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1.5">Items tracked</p>
                <p className="text-[22px] font-semibold text-white/80">{topPayments.length}</p>
                <p className="text-[10px] text-white/20 mt-1">top payments</p>
              </div>
              <div className={`rounded-2xl p-4 border ${
                criticalCount > 0
                  ? 'bg-rose-500/[0.07] border-rose-500/20'
                  : 'bg-white/[0.04] border-white/[0.07]'
              }`}>
                <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1.5">Alerts</p>
                <p className={`text-[22px] font-semibold ${criticalCount > 0 ? 'text-rose-400' : 'text-white/30'}`}>
                  {alerts.length}
                </p>
                <p className="text-[10px] text-white/20 mt-1">
                  {criticalCount > 0 ? `${criticalCount} critical` : 'all clear'}
                </p>
              </div>
            </motion.div>

            {/* Donut chart */}
            {breakdown.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.4 }}
                className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5"
              >
                <div className="mb-4">
                  <p className="text-[14px] font-medium text-white/85">Spending breakdown</p>
                  <p className="text-[12px] text-white/30 mt-0.5">By category — hover to inspect</p>
                </div>
                <DonutChart breakdown={breakdown} total={totalMonthly} />
              </motion.div>
            )}

            {/* Top payments ranked list */}
            {topPayments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13, duration: 0.4 }}
                className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-white/[0.07]">
                  <p className="text-[14px] font-medium text-white/85">Top payments</p>
                  <p className="text-[12px] text-white/30 mt-0.5">
                    Ranked by amount — transactions &amp; bills
                  </p>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {topPayments.map((p, i) => (
                    <PaymentRow key={p.id} payment={p} index={i} maxAmount={maxAmount} />
                  ))}
                </div>

                {/* Source legend */}
                <div className="px-5 pb-4 flex gap-4 border-t border-white/[0.05] pt-3">
                  {(['transaction', 'bill'] as PaymentSource[]).map(src => (
                    <div key={src} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SOURCE_COLOR[src] }} />
                      <span className="text-[11px] text-white/30">{SOURCE_LABEL[src]}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Alerts */}
            {alerts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.4 }}
                className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-white/[0.07]">
                  <p className="text-[14px] font-medium text-white/85">Active alerts</p>
                  <p className="text-[12px] text-white/30 mt-0.5">
                    Bills and contracts that need attention
                  </p>
                </div>
                <div className="p-4 space-y-2">
                  {alerts.map((a, i) => <AlertCard key={a.id} alert={a} index={i} />)}
                </div>
              </motion.div>
            )}

            {/* Gmail panel */}
            <GmailPanel alerts={alerts} />
          </>
        )}

      </div>
    </div>
  )
}

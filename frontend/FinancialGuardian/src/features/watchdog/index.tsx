import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWatchdog } from './hooks/useWatchdog'
import { NotificationPanel } from './components/NotificationPanel'
import type { CategoryBreakdown, AggregatedPayment, WatchdogAlert, AlertSeverity, PaymentSource } from './types'


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


function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="h-64 rounded-2xl bg-white/[0.03] animate-pulse" />
      <div className="h-48 rounded-2xl bg-white/[0.03] animate-pulse" />
    </div>
  )
}


export default function Watchdog() {
  const { topPayments, breakdown, alerts, totalMonthly, loading, error } = useWatchdog()

  const maxAmount     = topPayments[0]?.amount ?? 1
  const criticalCount = alerts.filter(a => a.severity === 'critical').length

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white p-6 lg:p-8">

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-teal-500/4 blur-[140px]" />
        {criticalCount > 0 && (
          <div className="absolute top-1/3 right-1/4 w-[280px] h-[280px] rounded-full bg-rose-500/4 blur-[100px]" />
        )}
      </div>

      <div className="relative max-w-3xl mx-auto space-y-8">

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

            <NotificationPanel alerts={alerts} />
          </>
        )}

      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { contractApi } from '../api'
import type { Obligation } from '../types'

interface SpendingChartsProps {
  refreshKey?: number
}

const TYPE_COLOR: Record<string, string> = {
  lease:        '#2dd4bf',
  utility:      '#f59e0b',
  insurance:    '#818cf8',
  subscription: '#34d399',
  internet:     '#60a5fa',
  phone:        '#f472b6',
  other:        '#94a3b8',
}

function typeColor(type?: string): string {
  return TYPE_COLOR[type ?? 'other'] ?? TYPE_COLOR.other
}

export function SpendingCharts({ refreshKey }: SpendingChartsProps) {
  const [obligations, setObligations] = useState<Obligation[]>([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    setLoading(true)
    contractApi.getAll()
      .then(res => setObligations(res.obligations))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [refreshKey])

  const active  = obligations.filter(o => !o.paid)
  const total   = active.reduce((sum, o) => sum + o.amount, 0)
  const sorted  = [...active].sort((a, b) => b.amount - a.amount)
  const maxCost = sorted[0]?.amount ?? 1

  if (loading) {
    return (
      <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5 space-y-3">
        {[80, 55, 40, 65, 30].map((w, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-20 h-3 rounded-full bg-white/[0.06]" />
            <div className="flex-1 h-5 rounded-lg bg-white/[0.04]" style={{ maxWidth: `${w}%` }} />
            <div className="w-10 h-3 rounded-full bg-white/[0.06]" />
          </div>
        ))}
      </div>
    )
  }

  if (sorted.length === 0) {
    return (
      <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-8 flex flex-col items-center gap-2 text-center">
        <p className="text-[13px] text-white/30">No active bills</p>
        <p className="text-[12px] text-white/20">Upload a contract above to see your spending breakdown</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
        <div>
          <p className="text-[14px] font-medium text-white/85">Monthly spending</p>
          <p className="text-[12px] text-white/30 mt-0.5">Unpaid obligations · from saved bills</p>
        </div>
        <div className="text-right">
          <p className="text-[18px] font-semibold font-mono text-teal-400">
            €{total.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-white/25 mt-0.5">total outstanding</p>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        {sorted.map((o, i) => {
          const pct      = (o.amount / maxCost) * 100
          const color    = typeColor(o.contractType)
          const sharePct = total > 0 ? ((o.amount / total) * 100).toFixed(0) : '0'

          return (
            <motion.div
              key={o._id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              className="flex items-center gap-3"
            >
              <div className="w-24 shrink-0">
                <p className="text-[12px] text-white/55 truncate">{o.provider}</p>
                <p className="text-[10px] text-white/25 mt-0.5">
                  {new Date(o.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </p>
              </div>

              <div className="flex-1 h-6 bg-white/[0.04] rounded-lg overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.6, ease: [0.4, 0, 0.2, 1] as [number,number,number,number] }}
                  className="absolute inset-y-0 left-0 rounded-lg flex items-center px-2.5"
                  style={{ backgroundColor: `${color}22`, borderRight: `2px solid ${color}60` }}
                >
                  {pct > 25 && (
                    <span className="text-[10px] font-medium" style={{ color }}>{sharePct}%</span>
                  )}
                </motion.div>
              </div>

              <div className="w-16 text-right shrink-0">
                <p className="text-[13px] font-medium font-mono" style={{ color }}>
                  €{o.amount.toFixed(2)}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="px-5 pb-4 pt-1 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/[0.05]">
        {Object.entries(TYPE_COLOR).map(([type, color]) => {
          if (!sorted.some(o => (o.contractType ?? 'other') === type)) return null
          return (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[11px] text-white/30 capitalize">{type}</span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

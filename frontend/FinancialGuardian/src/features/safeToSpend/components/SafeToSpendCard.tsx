import { motion } from 'framer-motion'
import type { FinancialSnapshot } from '../types'

interface Props {
  snapshot: FinancialSnapshot
}

function Row({ label, amount, color }: { label: string; amount: number; color: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0">
      <span className="text-[12px] text-white/40">{label}</span>
      <span className={`text-[13px] font-mono font-medium ${color}`}>
        €{amount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
  )
}

export function SafeToSpendCard({ snapshot }: Props) {
  const { income, expenses, billsTotal, safeToSpend } = snapshot
  const isHealthy = safeToSpend > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden"
    >
      {/* Main number */}
      <div className={`px-6 py-6 border-b border-white/[0.07] ${isHealthy ? '' : 'bg-rose-500/[0.04]'}`}>
        <p className="text-[11px] text-white/35 uppercase tracking-widest mb-2">Safe to spend</p>
        <motion.p
          key={safeToSpend}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={`text-[42px] font-semibold font-mono tracking-tight ${
            isHealthy ? 'text-teal-400' : 'text-rose-400'
          }`}
        >
          €{safeToSpend.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </motion.p>
        <p className="text-[12px] text-white/30 mt-1">
          {isHealthy
            ? 'after income, expenses and unpaid bills'
            : 'you are spending more than you earn'}
        </p>
      </div>

      {/* Breakdown */}
      <div className="px-6 py-4">
        <p className="text-[11px] text-white/25 uppercase tracking-wider mb-2">Breakdown</p>
        <Row label="Monthly income"     amount={income}     color="text-teal-400" />
        <Row label="Monthly expenses"   amount={expenses}   color="text-rose-400" />
        <Row label="Unpaid bills"       amount={billsTotal} color="text-amber-400" />
      </div>

      {/* Top categories */}
      {snapshot.expensesByCategory.length > 0 && (
        <div className="px-6 pb-5">
          <p className="text-[11px] text-white/25 uppercase tracking-wider mb-3">Top expense categories</p>
          <div className="space-y-2">
            {snapshot.expensesByCategory.slice(0, 5).map((cat, i) => {
              const pct = expenses > 0 ? (cat.amount / expenses) * 100 : 0
              return (
                <div key={cat.category} className="flex items-center gap-3">
                  <span className="text-[11px] text-white/40 capitalize w-24 shrink-0 truncate">{cat.category}</span>
                  <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: i * 0.05 + 0.3, duration: 0.5, ease: [0.4, 0, 0.2, 1] as [number,number,number,number] }}
                      className="h-full rounded-full bg-rose-400/70"
                    />
                  </div>
                  <span className="text-[11px] font-mono text-white/40 w-16 text-right shrink-0">
                    €{cat.amount.toFixed(2)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </motion.div>
  )
}

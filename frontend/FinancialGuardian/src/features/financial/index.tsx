import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { transactionApi } from '@/lib/api'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { useDriftDetection } from './hooks/useDriftDetection'
import { DriftInsight } from './components/DriftInsight'

// ─── Types ────────────────────────────────────────────────────────────────────

type Transaction = {
  _id:      string
  merchant: string
  amount:   number
  type:     'income' | 'expense'
  category: string
  date:     string
}

// ─── Category icon map ────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  food:          '🍽',
  groceries:     '🛒',
  transport:     '🚌',
  entertainment: '🎬',
  health:        '💊',
  shopping:      '🛍',
  utilities:     '💡',
  salary:        '💼',
  income:        '💼',
  rent:          '🏠',
  travel:        '✈️',
  subscriptions: '📦',
}

function categoryIcon(category: string): string {
  return CATEGORY_ICONS[category?.toLowerCase()] ?? '•'
}

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  }),
}

// ─── Risk score (pure function, called inside component) ──────────────────────

function computeRisk(income: number, expenses: number, unpaidCount: number, driftCount: number) {
  if (income === 0) return {
    score: 80, label: 'High', sublabel: 'No income detected',
    color: 'text-rose-400', barColor: 'from-rose-500 to-rose-400',
    dotColor: 'bg-rose-400 shadow-rose-400/40',
  }

  let score = 0
  score += Math.min((expenses / income) * 50, 50)
  score += Math.min(unpaidCount * 10, 20)
  score += Math.min(driftCount * 8, 16)
  score = Math.round(Math.min(score, 100))

  const label    = score < 25 ? 'Stable'   : score < 50 ? 'Moderate' : score < 75 ? 'Elevated' : 'High'
  const sublabel = score < 25 ? 'Low exposure' : score < 50 ? 'Monitor spending' : score < 75 ? 'Action recommended' : 'Immediate attention'
  const color    = score < 25 ? 'text-teal-400'  : score < 50 ? 'text-amber-400'  : 'text-rose-400'
  const barColor = score < 25 ? 'from-teal-500 to-teal-400' : score < 50 ? 'from-amber-500 to-amber-400' : 'from-rose-500 to-rose-400'
  const dotColor = score < 25 ? 'bg-teal-400 shadow-teal-400/40' : score < 50 ? 'bg-amber-400' : 'bg-rose-400 shadow-rose-400/40'

  return { score, label, sublabel, color, barColor, dotColor }
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-white/[0.06]" />
        <div className="space-y-1.5">
          <div className="w-28 h-3 rounded-full bg-white/[0.06]" />
          <div className="w-16 h-2.5 rounded-full bg-white/[0.04]" />
        </div>
      </div>
      <div className="w-14 h-3 rounded-full bg-white/[0.06]" />
    </div>
  )
}

// ─── FinancialFeature ─────────────────────────────────────────────────────────

export function FinancialFeature() {
  const user   = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [unpaidCount,  setUnpaidCount]  = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        // Fetch transactions + unpaid bills count in parallel
        const [txRes, billRes] = await Promise.allSettled([
          transactionApi.getAll(),
          fetch('http://localhost:3000/api/obligations', { credentials: 'include' }).then(r => r.json()),
        ])

        if (txRes.status === 'fulfilled') {
          setTransactions(txRes.value.transactions ?? [])
        } else {
          setError('Could not load transactions')
        }

        if (billRes.status === 'fulfilled') {
          const unpaid = (billRes.value.obligations ?? []).filter((b: any) => !b.paid).length
          setUnpaidCount(unpaid)
        }
      } catch (err: any) {
        setError(err.message || 'Could not load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Drift detection — runs on transactions once loaded ─────────────────────
  const drift = useDriftDetection(transactions)

  // ── Derived stats ──────────────────────────────────────────────────────────
  const income   = transactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0)
  const expenses = transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0)
  const balance  = income - expenses

  // ── Risk score — computed from live data inside component ──────────────────
  const risk = computeRisk(income, expenses, unpaidCount, drift.events.length)

  const formatEur = (n: number) =>
    `€${n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white p-6 lg:p-8">

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-teal-500/4 blur-[140px]" />
      </div>

      <div className="relative max-w-5xl mx-auto space-y-6">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2l5 2v4c0 3-2.5 5-5 6C5.5 13 3 11 3 8V4l5-2z" />
                </svg>
              </div>
              <span className="text-white/40 text-[12px] font-medium uppercase tracking-widest">Guardian</span>
            </div>
            <h1 className="text-[22px] font-semibold tracking-tight">
              Good morning, {user?.name?.split(' ')[0]}
              <span className="text-teal-400">.</span>
            </h1>
            <p className="text-white/40 text-[13px] mt-0.5">Here's your financial overview</p>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white/40 border border-white/10 hover:border-white/20 hover:text-white/60 transition-all duration-150"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 8H2M6 4l-4 4 4 4M11 4h2a1 1 0 011 1v6a1 1 0 01-1 1h-2" />
            </svg>
            Sign out
          </button>
        </motion.div>

        {/* ── Stat row ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Net balance', value: `${balance >= 0 ? '' : '−'}${formatEur(Math.abs(balance))}`, positive: balance >= 0, i: 0 },
            { label: 'Income',      value: formatEur(income),   positive: true,  i: 1 },
            { label: 'Expenses',    value: formatEur(expenses), positive: false, i: 2 },
          ].map(({ label, value, positive, i }) => (
            <motion.div
              key={label}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5"
            >
              <p className="text-[11px] font-medium text-white/35 uppercase tracking-widest mb-2">{label}</p>
              {loading ? (
                <div className="w-24 h-7 rounded-lg bg-white/[0.06] animate-pulse mt-1" />
              ) : (
                <p className={`text-[26px] font-semibold tracking-tight font-mono ${positive ? 'text-teal-400' : 'text-rose-400'}`}>
                  {value}
                </p>
              )}
            </motion.div>
          ))}
        </div>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">

          {/* Transactions — 2 cols */}
          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="col-span-2 bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
              <div>
                <p className="text-[14px] font-medium text-white/90">Transactions</p>
                <p className="text-[12px] text-white/35 mt-0.5">From your account</p>
              </div>
              {!loading && (
                <span className="text-[11px] font-medium text-white/30 bg-white/[0.06] border border-white/[0.08] px-2.5 py-1 rounded-full">
                  {transactions.length} entries
                </span>
              )}
            </div>

            <div className="divide-y divide-white/[0.05] max-h-80 overflow-y-auto">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <p className="text-[13px] text-rose-400">{error}</p>
                  <p className="text-[12px] text-white/25">Check your connection and try again</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <p className="text-[13px] text-white/40">No transactions yet</p>
                </div>
              ) : (
                transactions.map((t, i) => (
                  <motion.div
                    key={t._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.035 }}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.03] transition-colors duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[14px] shrink-0 ${
                        t.type === 'income'
                          ? 'bg-teal-500/10 border border-teal-500/20'
                          : 'bg-rose-500/10 border border-rose-500/20'
                      }`}>
                        {categoryIcon(t.category)}
                      </div>
                      <div>
                        <p className="text-[13.5px] font-medium text-white/85">{t.merchant}</p>
                        <p className="text-[11px] text-white/30 mt-0.5">
                          {t.category} · {new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[14px] font-semibold font-mono tabular-nums ${
                      t.type === 'income' ? 'text-teal-400' : 'text-rose-400'
                    }`}>
                      {t.type === 'income' ? '+' : '−'}€{t.amount.toFixed(2)}
                    </span>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Right column */}
          <div className="flex flex-col gap-4">

            {/* Risk level — driven by real data */}
            <motion.div
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5 flex-1"
            >
              <p className="text-[11px] font-medium text-white/35 uppercase tracking-widest mb-3">Risk Level</p>

              {loading ? (
                <>
                  <div className="w-20 h-5 rounded-lg bg-white/[0.06] animate-pulse mb-3" />
                  <div className="h-1.5 rounded-full bg-white/[0.06] animate-pulse mb-2" />
                  <div className="w-32 h-2.5 rounded-full bg-white/[0.04] animate-pulse" />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2.5 h-2.5 rounded-full shadow-lg animate-pulse ${risk.dotColor}`} />
                    <span className={`text-[18px] font-semibold ${risk.color}`}>{risk.label}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${risk.score}%` }}
                      transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full bg-gradient-to-r ${risk.barColor}`}
                    />
                  </div>
                  <p className="text-[11px] text-white/25 mt-2">
                    {risk.sublabel} · {risk.score}/100
                  </p>
                </>
              )}
            </motion.div>

            {/* Drift insight */}
            <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
              <DriftInsight drift={drift} loading={loading} />
            </motion.div>

          </div>
        </div>

      </div>
    </div>
  )
}

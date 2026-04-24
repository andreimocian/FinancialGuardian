import { useEffect, useState } from 'react'
import { SectionCard, SectionCardGroup } from '@/components/ui/layout/SectionCard'
import { useAuthStore } from '@/stores/auth'
import { transactionApi } from '@/lib/api'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

type Transaction = {
  _id: string
  name: string
  amount: number
  category: string
  date: string
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

const fadeUp: Variants ={
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  }),
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
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await transactionApi.getAll()
        setTransactions(res.transactions)
      } catch (err: any) {
        setError(err.message || 'Could not load transactions')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Derived stats ──────────────────────────────────────────────────────────
  const balance  = transactions.reduce((acc, t) => acc + t.amount, 0)
  const income   = transactions.filter(t => t.amount > 0).reduce((a, t) => a + t.amount, 0)
  const expenses = transactions.filter(t => t.amount < 0).reduce((a, t) => a + t.amount, 0)

  const formatEur = (n: number) =>
    `${n >= 0 ? '' : '−'}€${Math.abs(n).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

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
            { label: 'Net balance', value: formatEur(balance),  positive: balance >= 0, i: 0 },
            { label: 'Income',      value: formatEur(income),   positive: true,         i: 1 },
            { label: 'Expenses',    value: formatEur(expenses),  positive: false,        i: 2 },
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
                        t.amount >= 0
                          ? 'bg-teal-500/10 border border-teal-500/20'
                          : 'bg-rose-500/10 border border-rose-500/20'
                      }`}>
                        {categoryIcon(t.category)}
                      </div>
                      <div>
                        <p className="text-[13.5px] font-medium text-white/85">{t.name}</p>
                        <p className="text-[11px] text-white/30 mt-0.5">
                          {t.category} · {new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[14px] font-semibold font-mono tabular-nums ${
                      t.amount >= 0 ? 'text-teal-400' : 'text-rose-400'
                    }`}>
                      {t.amount > 0 ? '+' : '−'}€{Math.abs(t.amount).toFixed(2)}
                    </span>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Right column */}
          <div className="flex flex-col gap-4">

            {/* Risk level */}
            <motion.div
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5 flex-1"
            >
              <p className="text-[11px] font-medium text-white/35 uppercase tracking-widest mb-3">Risk Level</p>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-lg shadow-teal-400/40 animate-pulse" />
                <span className="text-[18px] font-semibold text-white/90">Stable</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '28%' }}
                  transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-400"
                />
              </div>
              <p className="text-[11px] text-white/25 mt-2">Low exposure · 28/100</p>
            </motion.div>

            {/* Guardian tip */}
            <motion.div
              custom={5}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
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

          </div>
        </div>

      </div>
    </div>
  )
}

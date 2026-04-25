import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { contractApi } from '../api'
import type { Obligation } from '../types'

const TYPE_ICON: Record<string, string> = {
  lease:        '🏠',
  utility:      '💡',
  insurance:    '🛡',
  subscription: '📦',
  internet:     '🌐',
  phone:        '📱',
  other:        '📄',
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function urgencyColor(days: number): string {
  if (days < 0)  return 'text-white/25'
  if (days < 30) return 'text-rose-400'
  if (days < 90) return 'text-amber-400'
  return 'text-white/40'
}

interface ContractListProps {
  refreshKey?: number
}

export function ContractList({ refreshKey }: ContractListProps) {
  const [obligations, setObligations] = useState<Obligation[]>([])
  const [loading,     setLoading]     = useState(true)
  const [removing,    setRemoving]    = useState<string | null>(null)
  const [toggling,    setToggling]    = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    contractApi.getAll()
      .then(res => setObligations(res.obligations))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [refreshKey])

  const handleRemove = async (id: string) => {
    setRemoving(id)
    try {
      await contractApi.remove(id)
      setObligations(prev => prev.filter(o => o._id !== id))
    } catch (err) {
      console.error(err)
    } finally {
      setRemoving(null)
    }
  }

  const handleTogglePaid = async (obligation: Obligation) => {
    setToggling(obligation._id)
    try {
      const updated = obligation.paid
        ? await contractApi.markUnpaid(obligation._id)
        : await contractApi.markPaid(obligation._id)
      setObligations(prev =>
        prev.map(o => o._id === obligation._id ? updated.obligation : o)
      )
    } catch (err) {
      console.error(err)
    } finally {
      setToggling(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />
        ))}
      </div>
    )
  }

  if (obligations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
        <p className="text-[13px] text-white/30">No bills saved yet</p>
        <p className="text-[12px] text-white/20">Upload a contract above to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {obligations.map(o => {
          const days = o.dueDate ? daysUntil(o.dueDate) : null

          return (
            <motion.div
              key={o._id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex items-center gap-3 px-4 py-3.5 border rounded-xl group transition-colors ${
                o.paid
                  ? 'bg-teal-500/[0.04] border-teal-500/10'
                  : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center text-[16px] shrink-0">
                {TYPE_ICON[o.contractType ?? 'other'] ?? '📄'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-[13.5px] font-medium truncate ${o.paid ? 'text-white/40 line-through' : 'text-white/80'}`}>
                    {o.provider}
                  </p>
                  {o.paid && (
                    <span className="text-[10px] font-medium text-teal-400 bg-teal-500/10 border border-teal-500/20 px-1.5 py-0.5 rounded-md shrink-0">
                      Paid
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-white/30 mt-0.5">
                  €{o.amount.toFixed(2)}/{o.currency ?? 'EUR'}
                  {o.description ? ` · ${o.description}` : ''}
                </p>
              </div>

              {days !== null && (
                <div className="text-right shrink-0">
                  <p className={`text-[12px] font-medium ${o.paid ? 'text-white/25' : urgencyColor(days)}`}>
                    {o.paid
                      ? 'Done'
                      : days < 0
                      ? 'Overdue'
                      : days === 0
                      ? 'Due today'
                      : `${days}d left`}
                  </p>
                  <p className="text-[10px] text-white/20 mt-0.5">
                    {new Date(o.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </p>
                </div>
              )}

              <button
                onClick={() => handleTogglePaid(o)}
                disabled={toggling === o._id}
                title={o.paid ? 'Mark unpaid' : 'Mark paid'}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                  o.paid
                    ? 'text-teal-400 bg-teal-500/10 hover:bg-teal-500/20'
                    : 'opacity-0 group-hover:opacity-100 text-white/25 hover:text-teal-400 hover:bg-teal-500/10'
                }`}
              >
                {toggling === o._id ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-3 h-3 border border-white/20 border-t-teal-400 rounded-full"
                  />
                ) : (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => handleRemove(o._id)}
                disabled={removing === o._id}
                className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-white/25 hover:text-rose-400 hover:bg-rose-500/10 transition-all shrink-0"
              >
                {removing === o._id ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-3 h-3 border border-white/20 border-t-white/50 rounded-full"
                  />
                ) : (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M2 2l8 8M10 2l-8 8" />
                  </svg>
                )}
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

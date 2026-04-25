import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { contractApi } from '../api'
import type { ExtractedContract } from '../types'

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
  if (days < 0)   return 'text-white/25'
  if (days < 30)  return 'text-rose-400'
  if (days < 90)  return 'text-amber-400'
  return 'text-white/40'
}

interface ContractListProps {
  refreshKey?: number   // increment to force re-fetch
}

export function ContractList({ refreshKey }: ContractListProps) {
  const [contracts, setContracts] = useState<ExtractedContract[]>([])
  const [loading,   setLoading]   = useState(true)
  const [removing,  setRemoving]  = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    contractApi.getAll()
      .then(res => setContracts(res.contracts))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [refreshKey])

  const handleRemove = async (id: string) => {
    setRemoving(id)
    try {
      await contractApi.remove(id)
      setContracts(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error(err)
    } finally {
      setRemoving(null)
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

  if (contracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
        <p className="text-[13px] text-white/30">No contracts saved yet</p>
        <p className="text-[12px] text-white/20">Upload a contract above to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {contracts.map(c => {
          const days = c.endDate ? daysUntil(c.endDate) : null

          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 px-4 py-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl group hover:bg-white/[0.05] transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center text-[16px] shrink-0">
                {TYPE_ICON[c.contractType] ?? '📄'}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-medium text-white/80 truncate">{c.providerName}</p>
                <p className="text-[11px] text-white/30 mt-0.5">
                  €{c.monthlyCost}/mo · {c.contractType}
                </p>
              </div>

              {days !== null && (
                <div className="text-right shrink-0">
                  <p className={`text-[12px] font-medium ${urgencyColor(days)}`}>
                    {days < 0
                      ? 'Expired'
                      : days === 0
                      ? 'Ends today'
                      : `${days}d left`}
                  </p>
                  <p className="text-[10px] text-white/20 mt-0.5">
                    {new Date(c.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </p>
                </div>
              )}

              <button
                onClick={() => handleRemove(c.id)}
                disabled={removing === c.id}
                className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-white/25 hover:text-rose-400 hover:bg-rose-500/10 transition-all shrink-0"
                aria-label="Remove contract"
              >
                {removing === c.id ? (
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

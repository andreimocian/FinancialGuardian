import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { contractsApi } from './api'
import { useContractUpload } from './hooks/useContractUpload'
import type { Contract, TimelineEvent } from './types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function noticeDueDate(endDate: string, noticeDays: number): Date {
  const d = new Date(endDate)
  d.setDate(d.getDate() - noticeDays)
  return d
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

type Urgency = 'critical' | 'warning' | 'upcoming' | 'safe'

function getUrgency(days: number): Urgency {
  if (days < 0)  return 'critical'
  if (days < 14) return 'critical'
  if (days < 30) return 'warning'
  if (days < 90) return 'upcoming'
  return 'safe'
}

const URGENCY: Record<Urgency, { bar: string; badge: string; text: string; label: string }> = {
  critical: { bar: 'bg-rose-500',  badge: 'bg-rose-500/10 border-rose-500/20 text-rose-400',   text: 'text-rose-400',  label: 'Act now'  },
  warning:  { bar: 'bg-amber-400', badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400', text: 'text-amber-400', label: 'Soon'     },
  upcoming: { bar: 'bg-teal-400',  badge: 'bg-teal-500/10 border-teal-500/20 text-teal-400',   text: 'text-teal-400',  label: 'Upcoming' },
  safe:     { bar: 'bg-white/10',  badge: 'bg-white/[0.05] border-white/10 text-white/30',     text: 'text-white/30',  label: 'On track' },
}

const TYPE_ICON: Record<string, string> = {
  internet: '🌐', phone: '📱', insurance: '🛡', lease: '🏠', subscription: '📦', other: '📄',
}

// ─── DropZone ─────────────────────────────────────────────────────────────────

function DropZone({ onFiles, disabled }: { onFiles: (f: File[]) => void; disabled?: boolean }) {
  const [dragging, setDragging] = useState(false)
  const handle = useCallback((raw: FileList | null) => { if (raw) onFiles(Array.from(raw)) }, [onFiles])

  return (
    <motion.label
      animate={{
        borderColor: dragging ? 'rgba(45,212,191,0.6)' : 'rgba(255,255,255,0.08)',
        backgroundColor: dragging ? 'rgba(45,212,191,0.04)' : 'rgba(255,255,255,0.02)',
      }}
      transition={{ duration: 0.15 }}
      onDragOver={e => { e.preventDefault(); if (!disabled) setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); if (!disabled) handle(e.dataTransfer.files) }}
      className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-10 cursor-pointer"
      style={{ minHeight: 180 }}
    >
      <input type="file" accept=".pdf,.zip" multiple className="hidden" onChange={e => handle(e.target.files)} disabled={disabled} />
      <motion.div
        animate={{ scale: dragging ? 1.1 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6M12 18v-6M9 15l3-3 3 3" />
        </svg>
      </motion.div>
      <div className="text-center">
        <p className="text-[14px] font-medium text-white/70">{dragging ? 'Drop to scan' : 'Drop contracts here'}</p>
        <p className="text-[12px] text-white/30 mt-1">PDF or ZIP · lease, phone, insurance, internet</p>
      </div>
      <span className="text-[13px] text-teal-400 font-medium">or browse files</span>
    </motion.label>
  )
}

// ─── Upload row ───────────────────────────────────────────────────────────────

function UploadRow({ f, onRemove }: { f: ReturnType<typeof useContractUpload>['files'][0]; onRemove: () => void }) {
  const statusLabel: Record<string, string> = {
    idle: 'Queued', uploading: 'Uploading…', extracting: 'Guardian is reading…', done: 'Extracted', error: 'Failed',
  }
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
      className="bg-white/[0.04] border border-white/[0.07] rounded-xl overflow-hidden"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0 text-[13px]">
          {f.status === 'done' ? '✓' : f.status === 'error' ? '✗' : '📄'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-white/80 truncate">{f.file.name}</p>
          <p className={`text-[11px] mt-0.5 ${f.status === 'error' ? 'text-rose-400' : f.status === 'done' ? 'text-teal-400' : 'text-white/30'}`}>
            {f.error ?? statusLabel[f.status]}
          </p>
        </div>
        {(f.status === 'idle' || f.status === 'error') && (
          <button onClick={onRemove} className="w-6 h-6 flex items-center justify-center text-white/25 hover:text-white/60 transition-colors">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2 2l8 8M10 2l-8 8" />
            </svg>
          </button>
        )}
      </div>
      {f.status === 'uploading' && (
        <div className="h-[2px] bg-white/[0.06] mx-4 mb-3 rounded-full overflow-hidden">
          <motion.div className="h-full bg-teal-400 rounded-full" style={{ width: `${f.progress}%` }} />
        </div>
      )}
      {f.status === 'extracting' && (
        <div className="h-[2px] bg-white/[0.06] mx-4 mb-3 rounded-full overflow-hidden">
          <motion.div className="h-full w-1/3 bg-teal-400/60 rounded-full"
            animate={{ x: ['-100%', '400%'] }} transition={{ duration: 1.4, repeat: Infinity }} />
        </div>
      )}
    </motion.div>
  )
}

// ─── Contract card ────────────────────────────────────────────────────────────

function ContractCard({ contract, index }: { contract: Contract; index: number }) {
  // noticePeriodDays can be null from backend — treat null as 0
  const noticeDays   = contract.noticePeriodDays ?? 0
  const daysToNotice = contract.endDate && noticeDays > 0
    ? Math.ceil((noticeDueDate(contract.endDate, noticeDays).getTime() - Date.now()) / 86400000)
    : null
  const urgency = daysToNotice !== null ? getUrgency(daysToNotice) : 'safe'
  const styles  = URGENCY[urgency]

  // monthlyAmount is the real backend field
  const amount = contract.monthlyAmount ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
      className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden"
    >
      <div className={`h-[3px] w-full ${styles.bar}`} />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-[20px]">{TYPE_ICON[contract.contractType ?? 'other'] ?? '📄'}</span>
            <div>
              <p className="text-[15px] font-medium text-white/85">{contract.provider}</p>
              <p className="text-[12px] text-white/30 mt-0.5 capitalize">
                {contract.contractType ?? contract.status ?? 'contract'}
              </p>
            </div>
          </div>
          {daysToNotice !== null && (
            <span className={`text-[11px] font-medium px-2 py-1 rounded-lg border shrink-0 ${styles.badge}`}>
              {styles.label}
            </span>
          )}
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.03] rounded-xl p-3">
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Monthly cost</p>
            <p className="text-[20px] font-semibold font-mono text-teal-400">
              €{amount.toFixed(2)}
            </p>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-3">
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Notice period</p>
            <p className="text-[20px] font-semibold text-white/80">
              {noticeDays > 0 ? `${noticeDays}d` : '—'}
            </p>
          </div>
        </div>

        {/* Notice deadline warning */}
        {daysToNotice !== null && noticeDays > 0 && contract.endDate && (
          <div className={`rounded-xl px-3.5 py-2.5 border ${
            urgency === 'critical' ? 'bg-rose-500/[0.07] border-rose-500/20' :
            urgency === 'warning'  ? 'bg-amber-500/[0.07] border-amber-500/20' :
            'bg-white/[0.03] border-white/[0.06]'
          }`}>
            <p className={`text-[12.5px] leading-relaxed ${
              urgency === 'critical' ? 'text-rose-300' :
              urgency === 'warning'  ? 'text-amber-300' : 'text-white/40'
            }`}>
              {daysToNotice < 0
                ? `Notice deadline passed ${Math.abs(daysToNotice)}d ago — contract ends ${formatShort(contract.endDate)}`
                : daysToNotice === 0
                ? `Last day to give notice — contract ends ${formatShort(contract.endDate)}`
                : `Give notice by ${formatDate(noticeDueDate(contract.endDate, noticeDays).toISOString())} — ${daysToNotice} days left`
              }
            </p>
          </div>
        )}

        {/* Cancellation terms */}
        {contract.cancellationTerms && (
          <div>
            <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1.5">Cancellation terms</p>
            <p className="text-[12.5px] text-white/45 leading-relaxed italic">"{contract.cancellationTerms}"</p>
          </div>
        )}

        {/* Description */}
        {contract.description && (
          <div>
            <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1.5">Description</p>
            <p className="text-[12.5px] text-white/40 leading-relaxed">{contract.description}</p>
          </div>
        )}

        {/* Date range */}
        <div className="flex items-center justify-between pt-1 border-t border-white/[0.05]">
          {contract.startDate && (
            <div>
              <p className="text-[10px] text-white/25 uppercase tracking-wider">Start</p>
              <p className="text-[12px] text-white/50 mt-0.5">{formatShort(contract.startDate)}</p>
            </div>
          )}
          {contract.endDate && (
            <div className="text-right">
              <p className="text-[10px] text-white/25 uppercase tracking-wider">End</p>
              <p className={`text-[12px] mt-0.5 ${styles.text}`}>{formatShort(contract.endDate)}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Timeline row ─────────────────────────────────────────────────────────────

function TimelineRow({ event, index, isLast }: { event: TimelineEvent; index: number; isLast: boolean }) {
  const urgency = getUrgency(event.daysLeft)
  const styles  = URGENCY[urgency]
  const amount  = event.monthlyAmount ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.055, duration: 0.3 }}
      className="flex gap-4"
    >
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
          urgency === 'critical' ? 'bg-rose-400 shadow-lg shadow-rose-500/30' :
          urgency === 'warning'  ? 'bg-amber-400' :
          urgency === 'upcoming' ? 'bg-teal-400' : 'bg-white/20'
        }`} />
        {!isLast && <div className="w-[1px] flex-1 bg-white/[0.06] mt-1.5" />}
      </div>

      <div className="pb-6 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <p className="text-[13.5px] font-medium text-white/80 truncate">{event.provider}</p>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border shrink-0 ${styles.badge}`}>
            {styles.label}
          </span>
        </div>
        <p className={`text-[12px] mb-1 ${styles.text}`}>
          {event.kind === 'notice' ? 'Notice deadline' : 'Contract ends'} — {formatDate(event.date)}
        </p>
        <p className="text-[11px] text-white/25">
          {event.daysLeft < 0 ? `${Math.abs(event.daysLeft)} days ago` :
           event.daysLeft === 0 ? 'Today' : `${event.daysLeft} days left`}
          {' · '}€{amount.toFixed(2)}/mo
        </p>
      </div>
    </motion.div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map(i => <div key={i} className="h-52 rounded-2xl bg-white/[0.03] animate-pulse" />)}
    </div>
  )
}

// ─── Contracts page ───────────────────────────────────────────────────────────

export default function ContractsPage() {
  const upload = useContractUpload()

  const [contracts,  setContracts]  = useState<Contract[]>([])
  const [timeline,   setTimeline]   = useState<TimelineEvent[]>([])
  const [loading,    setLoading]    = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [cRes, tRes] = await Promise.all([
        contractsApi.getAll(),
        contractsApi.getTimeline(),
      ])
      setContracts(cRes.contracts ?? [])
      setTimeline(tRes.events ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData, refreshKey])

  useEffect(() => {
    if (upload.files.some(f => f.status === 'done')) setRefreshKey(k => k + 1)
  }, [upload.files])

  useEffect(() => {
    if (!upload.allDone) return
    const t = setTimeout(() => upload.clearAll(), 3000)
    return () => clearTimeout(t)
  }, [upload.allDone, upload.clearAll])

  const sortedCards = [...contracts].sort((a, b) => {
    const noticeDaysA = a.noticePeriodDays ?? 0
    const noticeDaysB = b.noticePeriodDays ?? 0
    const da = a.endDate && noticeDaysA > 0
      ? Math.ceil((noticeDueDate(a.endDate, noticeDaysA).getTime() - Date.now()) / 86400000) : 999
    const db = b.endDate && noticeDaysB > 0
      ? Math.ceil((noticeDueDate(b.endDate, noticeDaysB).getTime() - Date.now()) / 86400000) : 999
    return da - db
  })

  const totalMonthly  = contracts.reduce((s, c) => s + (c.monthlyAmount ?? 0), 0)
  const criticalCount = sortedCards.filter(c => {
    const nd = c.noticePeriodDays ?? 0
    return c.endDate && nd > 0 &&
      getUrgency(Math.ceil((noticeDueDate(c.endDate, nd).getTime() - Date.now()) / 86400000)) === 'critical'
  }).length

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white p-6 lg:p-8">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-teal-500/4 blur-[140px]" />
        {criticalCount > 0 && (
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-rose-500/3 blur-[100px]" />
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
          <h1 className="text-[22px] font-semibold tracking-tight">Contracts<span className="text-teal-400">.</span></h1>
          <p className="text-white/40 text-[13px] mt-0.5">Notice periods, cancellation terms and what it's costing you</p>
        </motion.div>

        {/* Upload */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
          <DropZone onFiles={upload.addFiles} disabled={upload.isUploading || upload.isExtracting} />
          <AnimatePresence initial={false}>
            {upload.files.map(f => (
              <UploadRow key={f.id} f={f} onRemove={() => upload.removeFile(f.id)} />
            ))}
          </AnimatePresence>
          <AnimatePresence>
            {upload.hasIdle && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex justify-end">
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={upload.uploadAll}
                  className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white text-[13.5px] font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-teal-500/20 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M8 2l5 2v4c0 3-2.5 5-5 6C5.5 13 3 11 3 8V4l5-2z" />
                  </svg>
                  Scan contract
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Summary strip */}
        {!loading && contracts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="grid grid-cols-3 gap-4">
            <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4">
              <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1.5">Monthly obligations</p>
              <p className="text-[22px] font-semibold font-mono text-teal-400">
                €{totalMonthly.toFixed(2)}<span className="text-[12px] text-white/25 font-normal ml-1">/mo</span>
              </p>
            </div>
            <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4">
              <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1.5">Contracts tracked</p>
              <p className="text-[22px] font-semibold text-white/80">{contracts.length}</p>
            </div>
            <div className={`rounded-2xl p-4 border ${criticalCount > 0 ? 'bg-rose-500/[0.07] border-rose-500/20' : 'bg-white/[0.04] border-white/[0.07]'}`}>
              <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1.5">Need attention</p>
              <p className={`text-[22px] font-semibold ${criticalCount > 0 ? 'text-rose-400' : 'text-white/30'}`}>{criticalCount}</p>
            </div>
          </motion.div>
        )}

        {/* Contract cards */}
        {loading ? <Skeleton /> : contracts.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-12 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round">
                <path d="M10 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V5L10 2z" />
                <path d="M10 2v3h3M5 9h6M5 11.5h4" />
              </svg>
            </div>
            <p className="text-[14px] font-medium text-white/60">No contracts yet</p>
            <p className="text-[13px] text-white/30 max-w-xs">Upload a contract above — guardian extracts notice periods, costs and cancellation terms</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <p className="text-[11px] text-white/25 uppercase tracking-wider">Sorted by urgency</p>
            {sortedCards.map((c, i) => <ContractCard key={c._id} contract={c} index={i} />)}
          </div>
        )}

        {/* Timeline */}
        {!loading && timeline.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}
            className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.07]">
              <p className="text-[14px] font-medium text-white/85">Timeline</p>
              <p className="text-[12px] text-white/30 mt-0.5">Notice deadlines and contract end dates</p>
            </div>
            <div className="px-5 pt-5 pb-1">
              {timeline.map((e, i) => (
                <TimelineRow key={`${e._id}-${e.kind}`} event={e} index={i} isLast={i === timeline.length - 1} />
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  )
}

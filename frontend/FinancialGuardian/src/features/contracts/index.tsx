import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DropZone } from './components/DropZone'
import { UploadProgress } from './components/UploadProgress'
import { ContractList } from './components/ContractList'
import { SpendingCharts } from './components/SpendingCharts'
import { useFileUpload, OBLIGATION_TYPES } from './hooks/useFileUpload'
import { contractApi } from './api'


type TimelineEvent = {
  _id:          string
  provider:     string
  amount:       number
  currency:     string
  date:         string
  daysLeft:     number
  kind?:        string
  description?: string
}


type Urgency = 'critical' | 'warning' | 'upcoming' | 'safe'

function getUrgency(days: number): Urgency {
  if (days < 0)  return 'critical'
  if (days < 14) return 'critical'
  if (days < 30) return 'warning'
  if (days < 90) return 'upcoming'
  return 'safe'
}

const URGENCY: Record<Urgency, { badge: string; text: string; dot: string; label: string }> = {
  critical: { badge: 'bg-rose-500/10 border-rose-500/20 text-rose-400',   text: 'text-rose-400',   dot: 'bg-rose-400',   label: 'Act now'  },
  warning:  { badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400', text: 'text-amber-400', dot: 'bg-amber-400',  label: 'Soon'     },
  upcoming: { badge: 'bg-teal-500/10 border-teal-500/20 text-teal-400',   text: 'text-teal-400',   dot: 'bg-teal-400',   label: 'Upcoming' },
  safe:     { badge: 'bg-white/[0.05] border-white/10 text-white/30',     text: 'text-white/30',   dot: 'bg-white/20',   label: 'On track' },
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}


function TimelineRow({ event, index, isLast }: { event: TimelineEvent; index: number; isLast: boolean }) {
  const urgency = getUrgency(event.daysLeft)
  const styles  = URGENCY[urgency]

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.055, duration: 0.3 }}
      className="flex gap-4"
    >
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${styles.dot}`} />
        {!isLast && <div className="w-[1px] flex-1 bg-white/[0.06] mt-1.5" />}
      </div>

      <div className="pb-6 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <p className="text-[13.5px] font-medium text-white/80 truncate">{event.provider}</p>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border shrink-0 ${styles.badge}`}>
            {styles.label}
          </span>
        </div>
        <p className={`text-[12px] mb-1 ${styles.text}`}>Due {formatDate(event.date)}</p>
        <p className="text-[11px] text-white/25">
          {event.daysLeft < 0
            ? `${Math.abs(event.daysLeft)} days overdue`
            : event.daysLeft === 0 ? 'Due today'
            : `${event.daysLeft} days left`}
          {' · '}€{event.amount.toFixed(2)}
          {event.description ? ` · ${event.description}` : ''}
        </p>
      </div>
    </motion.div>
  )
}


export default function Bills() {
  const upload = useFileUpload()
  const [refreshKey, setRefreshKey] = useState(0)
  const [timeline,   setTimeline]   = useState<TimelineEvent[]>([])
  const [tlLoading,  setTlLoading]  = useState(true)

  const fetchTimeline = useCallback(async () => {
    setTlLoading(true)
    try {
      const res = await contractApi.getTimeline()
      setTimeline((res.events ?? []) as TimelineEvent[])
    } catch { /* silent */ }
    finally { setTlLoading(false) }
  }, [])

  useEffect(() => { fetchTimeline() }, [fetchTimeline, refreshKey])

  useEffect(() => {
    if (upload.files.some(f => f.status === 'done')) setRefreshKey(k => k + 1)
  }, [upload.files])

  useEffect(() => {
    if (!upload.allDone) return
    const t = setTimeout(() => upload.clearAll(), 3000)
    return () => clearTimeout(t)
  }, [upload.allDone, upload.clearAll])

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white p-6 lg:p-8">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-teal-500/4 blur-[140px]" />
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
          <h1 className="text-[22px] font-semibold tracking-tight">Bills<span className="text-teal-400">.</span></h1>
          <p className="text-white/40 text-[13px] mt-0.5">Upload a bill — guardian reads it and tracks your obligations</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[12px] text-white/35 uppercase tracking-wider shrink-0">Bill type</span>
            <div className="flex gap-2 flex-wrap">
              {OBLIGATION_TYPES.map(type => (
                <button key={type} onClick={() => upload.setDefaultType(type)}
                  className={`px-3 py-1 rounded-lg text-[12px] font-medium capitalize transition-all duration-150 ${
                    upload.defaultType === type
                      ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
                      : 'text-white/30 border border-white/[0.07] hover:text-white/50 hover:border-white/15'
                  }`}>{type}</button>
              ))}
            </div>
          </div>

          <DropZone onFiles={upload.addFiles} disabled={upload.isUploading || upload.isExtracting} />
          <UploadProgress files={upload.files} onRemove={upload.removeFile} />

          <AnimatePresence>
            {upload.hasIdle && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex justify-end">
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={upload.uploadAll}
                  className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white text-[13.5px] font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-teal-500/20 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M8 2l5 2v4c0 3-2.5 5-5 6C5.5 13 3 11 3 8V4l5-2z" />
                  </svg>
                  Scan bill
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <SpendingCharts refreshKey={refreshKey} />

        {(tlLoading || timeline.length > 0) && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}
            className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.07]">
              <p className="text-[14px] font-medium text-white/85">Payment timeline</p>
              <p className="text-[12px] text-white/30 mt-0.5">Unpaid bills ordered by due date</p>
            </div>
            <div className="px-5 pt-5 pb-1">
              {tlLoading ? (
                <div className="space-y-4 pb-4">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <div className="w-2.5 h-2.5 rounded-full bg-white/10 mt-1.5 shrink-0" />
                      <div className="flex-1 space-y-2 pb-4">
                        <div className="w-32 h-3 rounded-full bg-white/[0.06]" />
                        <div className="w-24 h-2.5 rounded-full bg-white/[0.04]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : timeline.map((e, i) => (
                <TimelineRow key={e._id} event={e} index={i} isLast={i === timeline.length - 1} />
              ))}
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}
          className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.07]">
            <p className="text-[14px] font-medium text-white/85">Saved bills</p>
            <p className="text-[12px] text-white/30 mt-0.5">Your obligation library</p>
          </div>
          <div className="p-4">
            <ContractList refreshKey={refreshKey} />
          </div>
        </motion.div>

      </div>
    </div>
  )
}

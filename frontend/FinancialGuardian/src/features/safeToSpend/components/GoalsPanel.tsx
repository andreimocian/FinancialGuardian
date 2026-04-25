import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { BackendGoal, GoalRecommendation, GoalFeasibility } from '../goalsApi'
import type { CreateGoalPayload } from '../goalsApi'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function monthsToReach(goal: BackendGoal, monthlySaving: number): number | null {
  const remaining = goal.targetAmount - goal.currentSaved
  if (remaining <= 0) return 0
  if (monthlySaving <= 0) return null
  return Math.ceil(remaining / monthlySaving)
}

// ─── Progress ring ────────────────────────────────────────────────────────────

function ProgressRing({ pct, color = '#2dd4bf' }: { pct: number; color?: string }) {
  const R = 26; const cx = 32
  const circumference = 2 * Math.PI * R
  const dash = (Math.min(pct, 100) / 100) * circumference

  return (
    <svg width={cx * 2} height={cx * 2} viewBox={`0 0 ${cx * 2} ${cx * 2}`}>
      <circle cx={cx} cy={cx} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
      <motion.circle
        cx={cx} cy={cx} r={R} fill="none" stroke={color} strokeWidth="4"
        strokeLinecap="round" strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference - dash }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] as [number,number,number,number] }}
        transform={`rotate(-90 ${cx} ${cx})`}
      />
      <text x={cx} y={cx + 4} textAnchor="middle" fill="rgba(255,255,255,0.7)"
        fontSize="10" fontWeight="600" fontFamily="monospace">
        {Math.round(pct)}%
      </text>
    </svg>
  )
}

// ─── Feasibility badge ────────────────────────────────────────────────────────

const FEASIBILITY: Record<GoalFeasibility, { label: string; style: string }> = {
  achievable:  { label: 'Achievable',  style: 'bg-teal-500/10 border-teal-500/20 text-teal-400' },
  tight:       { label: 'Tight',       style: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
  unrealistic: { label: 'Unrealistic', style: 'bg-rose-500/10 border-rose-500/20 text-rose-400' },
}

// ─── Recommendation card ──────────────────────────────────────────────────────

const ACTION_ICON: Record<GoalRecommendation['action'], string> = {
  reduce:    '↓',
  eliminate: '✕',
  review:    '?',
  maintain:  '✓',
}

const ACTION_COLOR: Record<GoalRecommendation['action'], string> = {
  reduce:    'text-amber-400',
  eliminate: 'text-rose-400',
  review:    'text-indigo-400',
  maintain:  'text-teal-400',
}

function RecommendationRow({ rec }: { rec: GoalRecommendation }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-white/[0.05] last:border-0">
      <span className={`text-[13px] font-bold shrink-0 mt-0.5 ${ACTION_COLOR[rec.action]}`}>
        {ACTION_ICON[rec.action]}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[12.5px] font-medium text-white/75 capitalize">{rec.category}</span>
          {rec.fromMonthly !== undefined && rec.toMonthly !== undefined && (
            <span className="text-[11px] text-white/30 font-mono">
              €{rec.fromMonthly} → €{rec.toMonthly}
            </span>
          )}
          {rec.fromMonthly !== undefined && rec.toMonthly === undefined && (
            <span className="text-[11px] text-white/30 font-mono">€{rec.fromMonthly} → €0</span>
          )}
        </div>
        <p className="text-[11.5px] text-white/40 leading-relaxed">{rec.reasoning}</p>
      </div>
      <span className="text-[12px] font-mono font-medium text-teal-400 shrink-0">
        +€{rec.monthlySavings}/mo
      </span>
    </div>
  )
}

// ─── Analysis panel ───────────────────────────────────────────────────────────

function AnalysisPanel({ goal, onAnalyze, analyzing }: {
  goal:      BackendGoal
  onAnalyze: () => void
  analyzing: boolean
}) {
  const a = goal.lastAnalysis

  return (
    <div className="mt-4 space-y-3">
      {a ? (
        <>
          {/* Feasibility + narrative */}
          <div className={`rounded-xl px-4 py-3 border ${
            a.feasibility === 'achievable' ? 'bg-teal-500/[0.06] border-teal-500/15' :
            a.feasibility === 'tight'      ? 'bg-amber-500/[0.06] border-amber-500/15' :
            'bg-rose-500/[0.06] border-rose-500/15'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${FEASIBILITY[a.feasibility].style}`}>
                {FEASIBILITY[a.feasibility].label}
              </span>
              <span className="text-[10px] text-white/25">
                Last analyzed {new Date(a.runAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            <p className="text-[12px] text-white/55 leading-relaxed">{a.feasibilityReason}</p>
            {a.narrative && (
              <p className="text-[11.5px] text-white/40 leading-relaxed mt-2 italic">"{a.narrative}"</p>
            )}
          </div>

          {/* Context numbers */}
          {a.context && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Monthly net',   value: `€${a.context.currentMonthlyNet.toFixed(0)}` },
                { label: 'Required/mo',   value: `€${a.context.requiredMonthly.toFixed(0)}` },
                { label: 'AI savings',    value: `€${a.totalProjectedSavings.toFixed(0)}` },
              ].map(s => (
                <div key={s.label} className="bg-white/[0.03] rounded-lg px-3 py-2">
                  <p className="text-[9px] text-white/25 uppercase tracking-wider">{s.label}</p>
                  <p className="text-[13px] font-mono font-medium text-white/65 mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {a.recommendations.length > 0 && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">
                Recommendations · saves €{a.totalProjectedSavings.toFixed(2)}/mo total
              </p>
              {a.recommendations.map((rec, i) => (
                <RecommendationRow key={i} rec={rec} />
              ))}
            </div>
          )}

          {/* Re-analyze */}
          <button
            onClick={onAnalyze}
            disabled={analyzing}
            className="text-[11px] text-white/25 hover:text-teal-400 transition-colors"
          >
            {analyzing ? 'Analyzing…' : '↻ Re-analyze with latest data'}
          </button>
        </>
      ) : (
        /* No analysis yet */
        <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
          <div>
            <p className="text-[12px] font-medium text-white/60">No analysis yet</p>
            <p className="text-[11px] text-white/30 mt-0.5">Let Guardian analyze your spending and create a plan</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={onAnalyze}
            disabled={analyzing}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all shrink-0 ${
              analyzing
                ? 'bg-teal-500/10 text-teal-400/50 cursor-not-allowed'
                : 'bg-teal-500/15 text-teal-400 border border-teal-500/25 hover:bg-teal-500/20'
            }`}
          >
            {analyzing ? (
              <>
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="inline-block w-3 h-3 border border-teal-400/30 border-t-teal-400 rounded-full" />
                Analyzing…
              </>
            ) : (
              <>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M8 2l5 2v4c0 3-2.5 5-5 6C5.5 13 3 11 3 8V4l5-2z" />
                </svg>
                Analyze
              </>
            )}
          </motion.button>
        </div>
      )}
    </div>
  )
}

// ─── Add goal form ────────────────────────────────────────────────────────────

const EMOJIS = ['🎯', '✈️', '💻', '🏠', '🚗', '🎓', '💍', '🏖️', '🎸', '💪']

interface AddGoalFormProps {
  onAdd:    (payload: CreateGoalPayload) => Promise<void>
  onClose:  () => void
}

function AddGoalForm({ onAdd, onClose }: AddGoalFormProps) {
  const [name,        setName]        = useState('')
  const [target,      setTarget]      = useState('')
  const [saved,       setSaved]       = useState('')
  const [deadline,    setDeadline]    = useState('')
  const [description, setDescription] = useState('')
  const [emoji,       setEmoji]       = useState('🎯')
  const [submitting,  setSubmitting]  = useState(false)
  const [err,         setErr]         = useState<string | null>(null)

  const submit = async () => {
    const t = parseFloat(target)
    if (!name.trim() || isNaN(t) || t <= 0 || !deadline) {
      setErr('Name, target amount and deadline are required')
      return
    }
    setSubmitting(true)
    setErr(null)
    try {
      await onAdd({
        name:         `${emoji} ${name.trim()}`,
        targetAmount: t,
        currentSaved: parseFloat(saved) || 0,
        targetDate:   deadline,
        description:  description || undefined,
      })
      onClose()
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}
      className="bg-white/[0.05] border border-white/[0.1] rounded-2xl p-5 space-y-4"
    >
      <p className="text-[14px] font-medium text-white/80">New savings goal</p>

      {/* Emoji */}
      <div className="flex gap-2 flex-wrap">
        {EMOJIS.map(e => (
          <button key={e} onClick={() => setEmoji(e)}
            className={`text-[18px] w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              emoji === e ? 'bg-teal-500/20 border border-teal-500/30' : 'hover:bg-white/[0.06]'
            }`}>{e}</button>
        ))}
      </div>

      {/* Fields */}
      {[
        { label: 'Goal name *',           value: name,        set: setName,        placeholder: 'Italy trip',  type: 'text'   },
        { label: 'Target amount (€) *',   value: target,      set: setTarget,      placeholder: '1500',        type: 'number' },
        { label: 'Already saved (€)',      value: saved,       set: setSaved,       placeholder: '0',           type: 'number' },
        { label: 'Description',           value: description, set: setDescription, placeholder: 'Optional',    type: 'text'   },
      ].map(f => (
        <div key={f.label} className="space-y-1.5">
          <label className="text-[11px] text-white/35 uppercase tracking-wider">{f.label}</label>
          <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)}
            placeholder={f.placeholder}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-[13px] text-white/80 placeholder-white/20 outline-none focus:border-teal-500/40 transition-colors" />
        </div>
      ))}

      <div className="space-y-1.5">
        <label className="text-[11px] text-white/35 uppercase tracking-wider">Target date *</label>
        <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-[13px] text-white/80 outline-none focus:border-teal-500/40 transition-colors"
          style={{ colorScheme: 'dark' }} />
      </div>

      {err && <p className="text-[12px] text-rose-400">{err}</p>}

      <div className="flex gap-3 pt-1">
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          onClick={submit} disabled={submitting}
          className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-colors shadow-lg ${
            submitting ? 'bg-teal-500/30 text-teal-300/50 cursor-not-allowed' : 'bg-teal-500 hover:bg-teal-400 text-white shadow-teal-500/20'
          }`}>
          {submitting ? 'Saving…' : 'Add goal'}
        </motion.button>
        <button onClick={onClose}
          className="px-4 py-2.5 rounded-xl text-[13px] text-white/40 border border-white/[0.08] hover:border-white/20 hover:text-white/60 transition-all">
          Cancel
        </button>
      </div>
    </motion.div>
  )
}

// ─── Goal card ────────────────────────────────────────────────────────────────

interface GoalCardProps {
  goal:          BackendGoal
  onUpdateSaved: (id: string, amount: number) => Promise<void>
  onRemove:      (id: string) => Promise<void>
  onAnalyze:     (id: string) => Promise<void>
  analyzing:     boolean
  monthlySaving: number
}

function GoalCard({ goal, onUpdateSaved, onRemove, onAnalyze, analyzing, monthlySaving }: GoalCardProps) {
  const [expanded,     setExpanded]     = useState(false)
  const [editingSaved, setEditingSaved] = useState(false)
  const [draft,        setDraft]        = useState(String(goal.currentSaved))

  const pct     = goal.targetAmount > 0 ? (goal.currentSaved / goal.targetAmount) * 100 : 0
  const days    = daysUntil(goal.targetDate)
  const months  = monthsToReach(goal, monthlySaving)
  const done    = goal.currentSaved >= goal.targetAmount

  const commitSaved = async () => {
    const val = parseFloat(draft)
    if (!isNaN(val) && val >= 0) await onUpdateSaved(goal._id, val)
    setEditingSaved(false)
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      className={`rounded-2xl border overflow-hidden transition-colors ${
        done ? 'bg-teal-500/[0.07] border-teal-500/20' : 'bg-white/[0.04] border-white/[0.07]'
      }`}
    >
      {/* Main row */}
      <div className="flex items-center gap-4 p-4">
        <div className="shrink-0">
          <ProgressRing pct={pct} color={done ? '#2dd4bf' : '#818cf8'} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[14px] font-medium text-white/85 truncate">{goal.name}</p>
            {done && <span className="text-[10px] font-medium text-teal-400 bg-teal-500/10 border border-teal-500/20 px-1.5 py-0.5 rounded-md shrink-0">Done!</span>}
            {goal.lastAnalysis && (
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border shrink-0 ${FEASIBILITY[goal.lastAnalysis.feasibility].style}`}>
                {FEASIBILITY[goal.lastAnalysis.feasibility].label}
              </span>
            )}
          </div>

          {/* Saved / target — inline edit */}
          <div className="flex items-center gap-1.5 mb-1">
            {editingSaved ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-white/30">€</span>
                <input autoFocus type="number" value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onBlur={commitSaved}
                  onKeyDown={e => { if (e.key === 'Enter') commitSaved(); if (e.key === 'Escape') setEditingSaved(false) }}
                  className="w-20 bg-white/[0.06] border border-teal-500/40 rounded-lg px-2 py-0.5 text-[12px] text-white/80 outline-none font-mono" />
                <span className="text-[11px] text-white/30">/ €{goal.targetAmount.toFixed(0)}</span>
              </div>
            ) : (
              <button onClick={() => { setDraft(String(goal.currentSaved)); setEditingSaved(true) }}
                className="text-[12px] font-mono text-white/50 hover:text-white/80 transition-colors">
                €{goal.currentSaved.toFixed(0)} <span className="text-white/25">/ €{goal.targetAmount.toFixed(0)}</span>
              </button>
            )}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-[11px] ${days < 30 && !done ? 'text-amber-400' : 'text-white/30'}`}>
              {formatDate(goal.targetDate)}
            </span>
            {months !== null && !done && (
              <span className="text-[11px] text-white/25">
                ~{months} months at current saving rate
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setExpanded(e => !e)}
            className="text-[11px] text-white/30 hover:text-teal-400 border border-white/[0.07] hover:border-teal-500/25 px-2.5 py-1.5 rounded-lg transition-all">
            {expanded ? 'Hide' : 'Analysis'}
          </button>
          <button onClick={() => onRemove(goal._id)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/20 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2 2l8 8M10 2l-8 8" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded analysis */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-white/[0.06] px-4 pb-4"
          >
            <AnalysisPanel goal={goal} onAnalyze={() => onAnalyze(goal._id)} analyzing={analyzing} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── GoalsPanel ───────────────────────────────────────────────────────────────

interface GoalsPanelProps {
  goals:         BackendGoal[]
  loading:       boolean
  error:         string | null
  analyzing:     string | null
  onAdd:         (payload: CreateGoalPayload) => Promise<void>
  onUpdateSaved: (id: string, amount: number) => Promise<void>
  onRemove:      (id: string) => Promise<void>
  onAnalyze:     (id: string) => Promise<void>
  monthlySaving: number
}

export function GoalsPanel({ goals, loading, error, analyzing, onAdd, onUpdateSaved, onRemove, onAnalyze, monthlySaving }: GoalsPanelProps) {
  const [showForm, setShowForm] = useState(false)

  const active    = goals.filter(g => g.status === 'active')
  const completed = goals.filter(g => g.status === 'completed' || g.currentSaved >= g.targetAmount)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
      className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">

      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
        <div>
          <p className="text-[14px] font-medium text-white/85">Savings goals</p>
          <p className="text-[12px] text-white/30 mt-0.5">
            {loading ? 'Loading…' : goals.length === 0 ? 'Add your first goal' : `${active.length} active · ${completed.length} completed`}
          </p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(s => !s)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all ${
            showForm
              ? 'bg-white/[0.06] text-white/50 border border-white/[0.08]'
              : 'bg-teal-500/15 text-teal-400 border border-teal-500/25 hover:bg-teal-500/20'
          }`}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d={showForm ? 'M2 6h8' : 'M6 2v8M2 6h8'} />
          </svg>
          {showForm ? 'Cancel' : 'Add goal'}
        </motion.button>
      </div>

      <div className="p-4 space-y-3">
        <AnimatePresence>
          {showForm && <AddGoalForm key="form" onAdd={onAdd} onClose={() => setShowForm(false)} />}
        </AnimatePresence>

        {loading ? (
          <div className="space-y-3">
            {[0, 1].map(i => <div key={i} className="h-20 rounded-2xl bg-white/[0.03] animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="py-6 text-center">
            <p className="text-[13px] text-rose-400">{error}</p>
          </div>
        ) : goals.length === 0 && !showForm ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center">
            <p className="text-[13px] text-white/30">No goals yet</p>
            <p className="text-[12px] text-white/20 mt-1">Add a goal and Guardian will build a plan to reach it</p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {goals.map(g => (
              <GoalCard
                key={g._id} goal={g}
                onUpdateSaved={onUpdateSaved}
                onRemove={onRemove}
                onAnalyze={onAnalyze}
                analyzing={analyzing === g._id}
                monthlySaving={monthlySaving}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  )
}

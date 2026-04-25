import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SavingsGoal } from '../types'


function ProgressRing({ pct, color = '#2dd4bf' }: { pct: number; color?: string }) {
  const R  = 26
  const cx = 32
  const circumference = 2 * Math.PI * R
  const dash = (Math.min(pct, 100) / 100) * circumference

  return (
    <svg width={cx * 2} height={cx * 2} viewBox={`0 0 ${cx * 2} ${cx * 2}`}>
      <circle cx={cx} cy={cx} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
      <motion.circle
        cx={cx} cy={cx} r={R}
        fill="none" stroke={color} strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
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


function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
}

function daysToReach(goal: SavingsGoal, monthlySaving: number): number | null {
  const remaining = goal.targetAmount - goal.savedAmount
  if (remaining <= 0) return 0
  if (monthlySaving <= 0) return null
  return Math.ceil(remaining / (monthlySaving / 30))
}


const EMOJIS = ['🎯', '✈️', '💻', '🏠', '🚗', '🎓', '💍', '🏖️', '🎸', '💪']

interface AddGoalFormProps {
  onAdd: (name: string, target: number, deadline?: string, emoji?: string) => void
  onClose: () => void
}

function AddGoalForm({ onAdd, onClose }: AddGoalFormProps) {
  const [name,     setName]     = useState('')
  const [target,   setTarget]   = useState('')
  const [saved,    setSaved]    = useState('')
  const [deadline, setDeadline] = useState('')
  const [emoji,    setEmoji]    = useState('🎯')

  const submit = () => {
    const t = parseFloat(target)
    if (!name.trim() || isNaN(t) || t <= 0) return
    onAdd(name.trim(), t, deadline || undefined, emoji)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
      className="bg-white/[0.05] border border-white/[0.1] rounded-2xl p-5 space-y-4"
    >
      <p className="text-[14px] font-medium text-white/80">New savings goal</p>

      <div className="flex gap-2 flex-wrap">
        {EMOJIS.map(e => (
          <button
            key={e}
            onClick={() => setEmoji(e)}
            className={`text-[18px] w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              emoji === e ? 'bg-teal-500/20 border border-teal-500/30' : 'hover:bg-white/[0.06]'
            }`}
          >{e}</button>
        ))}
      </div>

      {[
        { label: 'Goal name', value: name, set: setName, placeholder: 'Italy trip', type: 'text' },
        { label: 'Target amount (€)', value: target, set: setTarget, placeholder: '1500', type: 'number' },
        { label: 'Already saved (€)', value: saved, set: setSaved, placeholder: '0', type: 'number' },
      ].map(f => (
        <div key={f.label} className="space-y-1.5">
          <label className="text-[11px] text-white/35 uppercase tracking-wider">{f.label}</label>
          <input
            type={f.type}
            value={f.value}
            onChange={e => f.set(e.target.value)}
            placeholder={f.placeholder}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-[13px] text-white/80 placeholder-white/20 outline-none focus:border-teal-500/40 transition-colors"
          />
        </div>
      ))}

      <div className="space-y-1.5">
        <label className="text-[11px] text-white/35 uppercase tracking-wider">Deadline (optional)</label>
        <input
          type="date"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-[13px] text-white/80 outline-none focus:border-teal-500/40 transition-colors"
          style={{ colorScheme: 'dark' }}
        />
      </div>

      <div className="flex gap-3 pt-1">
        <motion.button
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          onClick={submit}
          className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-white text-[13px] font-medium transition-colors shadow-lg shadow-teal-500/20"
        >
          Add goal
        </motion.button>
        <button onClick={onClose}
          className="px-4 py-2.5 rounded-xl text-[13px] text-white/40 border border-white/[0.08] hover:border-white/20 hover:text-white/60 transition-all">
          Cancel
        </button>
      </div>
    </motion.div>
  )
}


interface GoalCardProps {
  goal:          SavingsGoal
  onUpdateSaved: (id: string, amount: number) => void
  onRemove:      (id: string) => void
  monthlySaving: number
}

function GoalCard({ goal, onUpdateSaved, onRemove, monthlySaving }: GoalCardProps) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(String(goal.savedAmount))

  const pct      = goal.targetAmount > 0 ? (goal.savedAmount / goal.targetAmount) * 100 : 0
  const days     = daysToReach(goal, monthlySaving)
  const deadline = goal.deadline ? daysUntil(goal.deadline) : null
  const done     = goal.savedAmount >= goal.targetAmount

  const commit = () => {
    const val = parseFloat(draft)
    if (!isNaN(val) && val >= 0) onUpdateSaved(goal.id, val)
    setEditing(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${
        done
          ? 'bg-teal-500/[0.07] border-teal-500/20'
          : 'bg-white/[0.04] border-white/[0.07]'
      }`}
    >
      <div className="shrink-0">
        <ProgressRing pct={pct} color={done ? '#2dd4bf' : '#818cf8'} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[16px]">{goal.emoji}</span>
          <p className="text-[14px] font-medium text-white/85 truncate">{goal.name}</p>
          {done && <span className="text-[10px] font-medium text-teal-400 bg-teal-500/10 border border-teal-500/20 px-1.5 py-0.5 rounded-md">Done!</span>}
        </div>

        <div className="flex items-center gap-1.5 mb-1">
          {editing ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/30">€</span>
              <input
                autoFocus
                type="number"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
                className="w-20 bg-white/[0.06] border border-teal-500/40 rounded-lg px-2 py-0.5 text-[12px] text-white/80 outline-none font-mono"
              />
              <span className="text-[11px] text-white/30">/ €{goal.targetAmount.toFixed(0)}</span>
            </div>
          ) : (
            <button onClick={() => { setDraft(String(goal.savedAmount)); setEditing(true) }}
              className="text-[12px] font-mono text-white/50 hover:text-white/80 transition-colors">
              €{goal.savedAmount.toFixed(0)} <span className="text-white/25">/ €{goal.targetAmount.toFixed(0)}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {deadline !== null && !done && (
            <span className={`text-[11px] ${deadline < 30 ? 'text-amber-400' : 'text-white/30'}`}>
              {deadline < 0 ? 'Deadline passed' : `${deadline}d left`}
            </span>
          )}
          {days !== null && !done && monthlySaving > 0 && (
            <span className="text-[11px] text-white/30">
              ~{days} days at current saving rate
            </span>
          )}
          {!done && monthlySaving <= 0 && (
            <span className="text-[11px] text-white/20">Start saving to see projection</span>
          )}
        </div>
      </div>

      <button onClick={() => onRemove(goal.id)}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-white/20 hover:text-rose-400 hover:bg-rose-500/10 transition-all shrink-0">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 2l8 8M10 2l-8 8" />
        </svg>
      </button>
    </motion.div>
  )
}


interface GoalsPanelProps {
  goals:          SavingsGoal[]
  onAdd:          (name: string, target: number, deadline?: string, emoji?: string) => void
  onUpdateSaved:  (id: string, amount: number) => void
  onRemove:       (id: string) => void
  monthlySaving:  number
}

export function GoalsPanel({ goals, onAdd, onUpdateSaved, onRemove, monthlySaving }: GoalsPanelProps) {
  const [showForm, setShowForm] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
        <div>
          <p className="text-[14px] font-medium text-white/85">Savings goals</p>
          <p className="text-[12px] text-white/30 mt-0.5">
            {goals.length === 0 ? 'Add your first goal' : `${goals.length} goal${goals.length > 1 ? 's' : ''} tracked`}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(s => !s)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all ${
            showForm
              ? 'bg-white/[0.06] text-white/50 border border-white/[0.08]'
              : 'bg-teal-500/15 text-teal-400 border border-teal-500/25 hover:bg-teal-500/20'
          }`}
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d={showForm ? 'M2 6h8' : 'M6 2v8M2 6h8'} />
          </svg>
          {showForm ? 'Cancel' : 'Add goal'}
        </motion.button>
      </div>

      <div className="p-4 space-y-3">
        <AnimatePresence>
          {showForm && (
            <AddGoalForm key="form" onAdd={onAdd} onClose={() => setShowForm(false)} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {goals.length === 0 && !showForm && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="py-8 text-center"
            >
              <p className="text-[13px] text-white/30">No goals yet</p>
              <p className="text-[12px] text-white/20 mt-1">Add a goal and the AI will plan how to reach it</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {goals.map(g => (
            <GoalCard
              key={g.id}
              goal={g}
              onUpdateSaved={onUpdateSaved}
              onRemove={onRemove}
              monthlySaving={monthlySaving}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

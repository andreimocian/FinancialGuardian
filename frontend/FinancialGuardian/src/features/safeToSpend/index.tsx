import { motion } from 'framer-motion'
import { useSafeToSpend } from './hooks/useSafeToSpend'
import { useGoals } from './hooks/useGoals'
import { useSpendingChat } from './hooks/useSpendingChat'
import { SafeToSpendCard } from './components/SafeToSpendCard'
import { DailyLimitCard } from './components/DailyLimitPanel'
import { GoalsPanel } from './components/GoalsPanel'
import { ChatPanel } from './components/ChatPanel'

export default function SafeToSpend() {
  const { snapshot, loading, error } = useSafeToSpend()
  const { goals, addGoal, updateSaved, removeGoal } = useGoals()
  const { messages, loading: chatLoading, started, startAnalysis, sendMessage, reset } =
    useSpendingChat(snapshot, goals)

  const monthlySaving = snapshot?.safeToSpend ?? 0

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
          <h1 className="text-[22px] font-semibold tracking-tight">
            Safe to spend<span className="text-teal-400">.</span>
          </h1>
          <p className="text-white/40 text-[13px] mt-0.5">
            Your real spending power — and an AI plan to grow it
          </p>
        </motion.div>

        {loading ? (
          <>
            <div className="h-64 rounded-2xl bg-white/[0.03] animate-pulse" />
            <div className="h-52 rounded-2xl bg-white/[0.03] animate-pulse" />
          </>
        ) : error ? (
          <div className="bg-rose-500/[0.07] border border-rose-500/20 rounded-2xl p-6 text-center">
            <p className="text-[13px] text-rose-400">{error}</p>
          </div>
        ) : snapshot ? (
          <>
            <SafeToSpendCard snapshot={snapshot} />

            <DailyLimitCard snapshot={snapshot} />
          </>
        ) : null}

        <GoalsPanel
          goals={goals}
          onAdd={addGoal}
          onUpdateSaved={updateSaved}
          onRemove={removeGoal}
          monthlySaving={monthlySaving}
        />

        <ChatPanel
          messages={messages}
          loading={chatLoading}
          started={started}
          onStart={startAnalysis}
          onSend={sendMessage}
          onReset={reset}
          hasSnapshot={!!snapshot}
        />

      </div>
    </div>
  )
}

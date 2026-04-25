import { SectionCard } from "../../components/ui/layout"
import { useSummaryStore } from "../../stores/summary"

import SavingsHeadline from "./components/SavingsHeadline"
import ActionLog from "./components/ActionLog"
import BudgetStatusBadge from "./components/BudgetStatusBadge"

import { motion } from 'framer-motion'

export default function Summary() {
  const data = useSummaryStore()

  return (
    <div className="min-h-screen bg-[#0c0c0f] p-6 lg:p-8">

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[500px] rounded-full bg-teal-500/4 blur-[140px]" />
      </div>

      <div className="relative max-w-2xl mx-auto space-y-6">

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-[11px] font-medium text-white/35 uppercase tracking-widest mb-1">Weekly Summary</p>
          <h1 className="text-[26px] font-semibold text-white tracking-tight">
            Your guardian recap<span className="text-teal-400">.</span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden"
        >
          <div className="px-6 py-8 border-b border-white/[0.07] text-center">
            <p className="text-[11px] font-medium text-white/35 uppercase tracking-widest mb-4">Guardian saved you</p>
            <SavingsHeadline amount={data.saved} />
            <p className="text-[13px] text-white/35 mt-2">this week</p>
          </div>

          <div className="px-6 py-5 border-b border-white/[0.07]">
            <p className="text-[11px] font-medium text-white/35 uppercase tracking-widest mb-4">Actions taken</p>
            <ActionLog actions={data.actions} />
          </div>

          <div className="px-6 py-5">
            <p className="text-[11px] font-medium text-white/35 uppercase tracking-widest mb-3">Budget status</p>
            <BudgetStatusBadge goal={data.goal} />
          </div>
        </motion.div>

      </div>
    </div>
  )
}

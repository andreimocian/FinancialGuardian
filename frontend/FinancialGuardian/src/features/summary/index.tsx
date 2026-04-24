import { SectionCard } from "../../components/ui/layout"
import { useSummaryStore } from "../../stores/summary"

import SavingsHeadline from "./components/SavingsHeadline"
import ActionLog from "./components/ActionLog"
import BudgetStatusBadge from "./components/BudgetStatusBadge"

export default function Summary() {
  const data = useSummaryStore()

  return (
    <SectionCard
      title="Weekly Summary"
    >
      <SavingsHeadline amount={data.saved} />
      <ActionLog actions={data.actions} />
      <BudgetStatusBadge goal={data.goal} />
    </SectionCard>
  )
}
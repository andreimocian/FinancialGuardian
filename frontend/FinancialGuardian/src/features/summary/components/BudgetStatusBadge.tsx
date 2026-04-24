type Props = { goal: string }

export default function BudgetStatusBadge({ goal }: Props) {
  return <p>Goal: {goal} ✅</p>
}
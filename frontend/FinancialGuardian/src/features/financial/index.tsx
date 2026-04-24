import { SectionCard, SectionCardGroup } from '@/components/ui/layout/SectionCard'
import { transactions } from '../../mocks/transactions'
import { useAuthStore } from '@/stores/auth'

export function FinancialFeature() {
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)

  const balance = transactions.reduce((acc, t) => acc + t.amount, 0)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Welcome, {user?.name}
        </h1>

        {/* Logout */}
        <button
          onClick={logout}
          className="px-3 py-1 text-sm rounded bg-red-500 text-white hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      <SectionCardGroup columns={3}>
        <SectionCard title="Balance" accent="teal">
          ${balance}
        </SectionCard>

        <SectionCard title="Transactions">
          {transactions.length}
        </SectionCard>

        <SectionCard title="Risk Level" accent="amber">
          Stable
        </SectionCard>
      </SectionCardGroup>

    </div>
  )
}
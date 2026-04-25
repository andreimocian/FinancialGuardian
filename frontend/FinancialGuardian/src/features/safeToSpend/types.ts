
export type FinancialSnapshot = {
  income:        number
  expenses:      number
  billsTotal:    number
  safeToSpend:   number
  expensesByCategory: { category: string; amount: number }[]
}


export type SavingsGoal = {
  id:          string
  name:        string          
  targetAmount: number
  savedAmount:  number
  deadline?:   string          
  emoji?:      string
  createdAt:   string
}


export type ChatRole = 'user' | 'assistant'

export type ChatMessage = {
  id:        string
  role:      ChatRole
  content:   string
  timestamp: string
  loading?:  boolean
}

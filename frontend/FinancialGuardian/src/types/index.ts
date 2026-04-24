export type Transaction = {
  id: string
  name: string
  amount: number
  category: 'food' | 'rent' | 'subscriptions' | 'other'
  date: string
}

export type Subscription = {
  id: string
  name: string
  cost: number
  cycle: 'monthly' | 'yearly'
  active: boolean
}
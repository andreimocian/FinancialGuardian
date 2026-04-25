const API_URL = import.meta.env.VITE_BACKEND_URL

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

export const goalsApi = {
  // GET /api/goals
  getAll: (): Promise<{ goals: BackendGoal[] }> =>
    request('/goals'),

  // POST /api/goals — { name, targetAmount, currency, targetDate, currentSaved?, description? }
  create: (body: CreateGoalPayload): Promise<{ goal: BackendGoal }> =>
    request('/goals', { method: 'POST', body: JSON.stringify(body) }),

  // PATCH /api/goals/:id
  update: (id: string, body: Partial<CreateGoalPayload>): Promise<{ goal: BackendGoal }> =>
    request(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  // DELETE /api/goals/:id
  remove: (id: string) =>
    request(`/goals/${id}`, { method: 'DELETE' }),

  // POST /api/goals/:id/analyze — triggers Gemini analysis
  analyze: (id: string): Promise<{ goal: BackendGoal }> =>
    request(`/goals/${id}/analyze`, { method: 'POST' }),
}

// ─── Types matching backend model ────────────────────────────────────────────

export type CreateGoalPayload = {
  name:          string
  targetAmount:  number
  currency?:     string
  targetDate:    string    // ISO date string e.g. "2026-10-10"
  currentSaved?: number
  description?:  string
}

export type GoalStatus = 'active' | 'completed' | 'abandoned'

export type GoalFeasibility = 'achievable' | 'tight' | 'unrealistic'

export type GoalRecommendation = {
  category:       string
  action:         'reduce' | 'eliminate' | 'review' | 'maintain'
  fromMonthly?:   number
  toMonthly?:     number
  monthlySavings: number
  reasoning:      string
}

export type GoalAnalysis = {
  runAt:                  string
  feasibility:            GoalFeasibility
  feasibilityReason:      string
  narrative:              string
  recommendations:        GoalRecommendation[]
  totalProjectedSavings:  number
  context?: {
    avgMonthlyIncome:     number
    avgMonthlyExpenses:   number
    currentMonthlyNet:    number
    monthsLeft:           number
    requiredMonthly:      number
    recurringObligations: number
  }
}

export type BackendGoal = {
  _id:           string
  userId:        string
  name:          string
  targetAmount:  number
  currency:      string
  targetDate:    string
  currentSaved:  number
  description?:  string
  status:        GoalStatus
  lastAnalysis?: GoalAnalysis
  createdAt:     string
  updatedAt:     string
}

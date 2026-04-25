import { useState, useCallback, useRef } from 'react'
import type { ChatMessage, FinancialSnapshot, SavingsGoal } from '../types'

const API_URL = 'http://localhost:3000/api'

function uid() { return Math.random().toString(36).slice(2) }

function buildSystemContext(
  snapshot: FinancialSnapshot,
  goals: SavingsGoal[],
): string {
  const catBreakdown = snapshot.expensesByCategory
    .slice(0, 8)
    .map(c => `  - ${c.category}: €${c.amount.toFixed(2)}`)
    .join('\n')

  const goalsList = goals.length > 0
    ? goals.map(g => {
        const pct = g.targetAmount > 0
          ? ((g.savedAmount / g.targetAmount) * 100).toFixed(0)
          : '0'
        const deadline = g.deadline
          ? ` by ${new Date(g.deadline).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`
          : ''
        return `  - ${g.emoji} ${g.name}: €${g.savedAmount} / €${g.targetAmount} (${pct}%${deadline})`
      }).join('\n')
    : '  No goals set yet.'

  return `You are Guardian, an AI financial co-pilot focused on effortless living.
You help the user understand their finances, find savings, and reach their goals.
Be concise, empathetic, and specific. Use euro amounts. Avoid generic advice.

Current financial snapshot:
  Monthly income:    €${snapshot.income.toFixed(2)}
  Monthly expenses:  €${snapshot.expenses.toFixed(2)}
  Unpaid bills:      €${snapshot.billsTotal.toFixed(2)}
  Safe to spend:     €${snapshot.safeToSpend.toFixed(2)}

Expense breakdown:
${catBreakdown}

Savings goals:
${goalsList}

When suggesting cuts, be specific: name the category, the suggested reduction, and the monthly saving.
When talking about goals, calculate how many months to reach them at current or suggested saving rates.
Keep responses under 200 words unless the user asks for more detail.`
}

function buildInitialMessage(snapshot: FinancialSnapshot, goals: SavingsGoal[]): string {
  const hasGoals = goals.length > 0
  const goalNames = goals.map(g => `${g.emoji} ${g.name}`).join(', ')

  return hasGoals
    ? `Analyze my finances and give me a concrete savings plan to reach my goals: ${goalNames}. What's the fastest way to get there?`
    : `Analyze my spending and tell me where I can save money. My safe-to-spend is €${snapshot.safeToSpend.toFixed(2)}. What should I cut first?`
}

export function useSpendingChat(
  snapshot: FinancialSnapshot | null,
  goals: SavingsGoal[],
) {
  const [messages,  setMessages]  = useState<ChatMessage[]>([])
  const [loading,   setLoading]   = useState(false)
  const [started,   setStarted]   = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const addMessage = useCallback((role: ChatMessage['role'], content: string): ChatMessage => {
    const msg: ChatMessage = { id: uid(), role, content, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, msg])
    return msg
  }, [])

  const sendToAPI = useCallback(async (history: { role: string; content: string }[]) => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    const loadingId = uid()
    setMessages(prev => [...prev, {
      id: loadingId, role: 'assistant', content: '', loading: true,
      timestamp: new Date().toISOString(),
    }])

    try {
      const res = await fetch(`${API_URL}/ai/chat`, {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        signal:      abortRef.current.signal,
        body: JSON.stringify({
          messages: history,
          system:   snapshot ? buildSystemContext(snapshot, goals) : '',
        }),
      })

      if (!res.ok) throw new Error('AI request failed')
      const data = await res.json()
      const reply = data.reply ?? data.message ?? 'Sorry, I could not generate a response.'

      setMessages(prev => prev.map(m =>
        m.id === loadingId ? { ...m, content: reply, loading: false } : m
      ))
    } catch (err: any) {
      if (err.name === 'AbortError') return
      setMessages(prev => prev.map(m =>
        m.id === loadingId
          ? { ...m, content: 'Something went wrong. Please try again.', loading: false }
          : m
      ))
    }
  }, [snapshot, goals])

  const startAnalysis = useCallback(async () => {
    if (!snapshot || started) return
    setStarted(true)

    const initialContent = buildInitialMessage(snapshot, goals)
    const userMsg = { role: 'user', content: initialContent }

    setMessages([{
      id: uid(), role: 'user', content: initialContent,
      timestamp: new Date().toISOString(),
    }])

    setLoading(true)
    await sendToAPI([userMsg])
    setLoading(false)
  }, [snapshot, goals, started, sendToAPI])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading) return

    const userMsg = { role: 'user' as const, content }
    addMessage('user', content)

    const history = [
      ...messages
        .filter(m => !m.loading)
        .map(m => ({ role: m.role, content: m.content })),
      userMsg,
    ]

    setLoading(true)
    await sendToAPI(history)
    setLoading(false)
  }, [messages, loading, addMessage, sendToAPI])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setStarted(false)
  }, [])

  return { messages, loading, started, startAnalysis, sendMessage, reset }
}

import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ChatMessage } from '../types'

// ─── Thinking dots ────────────────────────────────────────────────────────────

function ThinkingDots() {
  return (
    <div className="flex gap-[4px] items-center px-1 py-1">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-[5px] h-[5px] rounded-full bg-teal-400/60"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-6 h-6 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0 mt-0.5 mr-2">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round">
            <path d="M8 2l5 2v4c0 3-2.5 5-5 6C5.5 13 3 11 3 8V4l5-2z" />
          </svg>
        </div>
      )}

      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed ${
          isUser
            ? 'bg-teal-500/15 border border-teal-500/20 text-white/80 rounded-tr-sm'
            : 'bg-white/[0.05] border border-white/[0.08] text-white/75 rounded-tl-sm'
        }`}>
          {msg.loading ? <ThinkingDots /> : (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          )}
        </div>
        <span className="text-[10px] text-white/20 px-1">
          {new Date(msg.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  )
}

// ─── Suggested follow-ups ─────────────────────────────────────────────────────

const FOLLOW_UPS = [
  'What if I cut dining out completely?',
  'Which subscriptions should I cancel first?',
  'How long to reach my biggest goal?',
  'What\'s the single biggest change I can make?',
  'Give me a 3-month savings plan',
]

// ─── ChatPanel ────────────────────────────────────────────────────────────────

interface ChatPanelProps {
  messages:       ChatMessage[]
  loading:        boolean
  started:        boolean
  onStart:        () => void
  onSend:         (msg: string) => void
  onReset:        () => void
  hasSnapshot:    boolean
}

export function ChatPanel({
  messages, loading, started, onStart, onSend, onReset, hasSnapshot,
}: ChatPanelProps) {
  const [input,    setInput]    = useState('')
  const [showSugg, setShowSugg] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Hide suggestions after first user follow-up
  useEffect(() => {
    const userMessages = messages.filter(m => m.role === 'user')
    if (userMessages.length > 1) setShowSugg(false)
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || loading) return
    onSend(input.trim())
    setInput('')
    setShowSugg(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round">
              <path d="M8 2l5 2v4c0 3-2.5 5-5 6C5.5 13 3 11 3 8V4l5-2z" />
            </svg>
          </div>
          <div>
            <p className="text-[14px] font-medium text-white/85">Guardian AI</p>
            <p className="text-[11px] text-white/30 mt-0.5">
              {loading ? 'Thinking…' : started ? 'Ready for follow-up questions' : 'Ready to analyze'}
            </p>
          </div>
        </div>

        {started && (
          <button
            onClick={onReset}
            className="text-[11px] text-white/25 hover:text-white/50 border border-white/[0.07] hover:border-white/15 px-2.5 py-1.5 rounded-lg transition-all"
          >
            New analysis
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-[200px] max-h-[420px]">
        {!started ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full gap-4 py-8 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round">
                <path d="M8 2l5 2v4c0 3-2.5 5-5 6C5.5 13 3 11 3 8V4l5-2z" />
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-medium text-white/70">Guardian is ready</p>
              <p className="text-[12px] text-white/30 mt-1 max-w-xs">
                {hasSnapshot
                  ? 'Click Analyze to get a personalised savings plan based on your financial data'
                  : 'Loading your financial data…'
                }
              </p>
            </div>
            {hasSnapshot && (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={onStart}
                className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white text-[13px] font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-teal-500/20 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M8 2l5 2v4c0 3-2.5 5-5 6C5.5 13 3 11 3 8V4l5-2z" />
                </svg>
                Analyze my finances
              </motion.button>
            )}
          </motion.div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
            </AnimatePresence>

            {/* Suggested follow-ups */}
            <AnimatePresence>
              {showSugg && !loading && messages.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex flex-wrap gap-2 pt-2"
                >
                  {FOLLOW_UPS.map(q => (
                    <button
                      key={q}
                      onClick={() => { onSend(q); setShowSugg(false) }}
                      className="text-[11px] text-white/40 border border-white/[0.08] hover:border-teal-500/30 hover:text-teal-400 px-3 py-1.5 rounded-xl transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      {started && (
        <div className="px-4 pb-4 pt-2 border-t border-white/[0.06] shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a follow-up question…"
              rows={1}
              disabled={loading}
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-[13px] text-white/80 placeholder-white/20 outline-none focus:border-teal-500/30 transition-colors resize-none disabled:opacity-40"
              style={{ minHeight: 40, maxHeight: 120 }}
            />
            <motion.button
              whileHover={!loading ? { scale: 1.05 } : {}}
              whileTap={!loading ? { scale: 0.95 } : {}}
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl bg-teal-500 hover:bg-teal-400 flex items-center justify-center shrink-0 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-teal-500/20"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2L7 9M14 2L9 14l-2-5L2 7l12-5z" />
              </svg>
            </motion.button>
          </div>
          <p className="text-[10px] text-white/18 mt-2 text-center">Enter to send · Shift+Enter for new line</p>
        </div>
      )}
    </motion.div>
  )
}

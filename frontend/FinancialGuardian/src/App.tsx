import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { FinancialFeature } from '@/features/financial'
import { Login } from '@/features/auth/Login'
import { Signup } from '@/features/auth/Signup'
import { AnimatePresence, motion } from 'framer-motion'
type Mode = 'login' | 'signup'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0c0c0f] flex items-center justify-center">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-teal-500/5 blur-[120px]" />
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative flex flex-col items-center gap-5"
      >
        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2l5 2v4c0 3-2.5 5-5 6C5.5 13 3 11 3 8V4l5-2z" />
          </svg>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-teal-400"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
        <p className="text-[12px] text-white/25 tracking-widest uppercase">Restoring session</p>
      </motion.div>
    </div>
  )
}

export default function App() {
  const user        = useAuthStore((s) => s.user)
  const initialized = useAuthStore((s) => s.initialized)
  const fetchMe     = useAuthStore((s) => s.fetchMe)
  const [mode, setMode] = useState<Mode>('login')

  useEffect(() => { fetchMe() }, [fetchMe])

  if (!initialized) return <LoadingScreen />

  return (
    <AnimatePresence mode="wait">
      {user ? (
        <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <FinancialFeature />
        </motion.div>
      ) : mode === 'login' ? (
        <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <Login onSwitch={() => setMode('signup')} />
        </motion.div>
      ) : (
        <motion.div key="signup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <Signup onSwitch={() => setMode('login')} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

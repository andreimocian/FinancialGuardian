import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { motion , AnimatePresence} from 'framer-motion'

export function Login({ onSwitch }: { onSwitch: () => void }) {
  const login = useAuthStore((s) => s.login)
  const loading = useAuthStore((s) => s.loading)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)

  const handleLogin = async () => {
    try {
      setError(null)
      await login(email, password)
    } catch (e: any) {
      setError(e.message || 'Login failed')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0c0c0f] overflow-hidden">

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-teal-500/5 blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-indigo-500/5 blur-[100px]" />
      </div>

      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="relative w-full max-w-sm mx-4"
      >

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2l5 2v4c0 3-2.5 5-5 6C5.5 13 3 11 3 8V4l5-2z" />
              </svg>
            </div>
            <span className="text-white/90 text-[15px] font-medium tracking-tight">
              guardian<span className="text-teal-400">.</span>
            </span>
          </div>
          <h1 className="text-[28px] font-semibold text-white tracking-tight leading-tight">
            Welcome back
          </h1>
          <p className="text-[14px] text-white/40 mt-1.5">
            Your financial guardian is watching
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-sm"
        >
          <div className="space-y-4">

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-white/40 uppercase tracking-wider">
                Email
              </label>
              <div className={`relative rounded-xl border transition-all duration-200 ${
                focused === 'email'
                  ? 'border-teal-500/50 bg-teal-500/5'
                  : 'border-white/10 bg-white/[0.03]'
              }`}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  onKeyDown={handleKeyDown}
                  placeholder="you@example.com"
                  className="w-full bg-transparent px-4 py-3 text-[14px] text-white placeholder-white/20 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-white/40 uppercase tracking-wider">
                Password
              </label>
              <div className={`relative rounded-xl border transition-all duration-200 ${
                focused === 'password'
                  ? 'border-teal-500/50 bg-teal-500/5'
                  : 'border-white/10 bg-white/[0.03]'
              }`}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  className="w-full bg-transparent px-4 py-3 text-[14px] text-white placeholder-white/20 outline-none"
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-rose-400 text-[13px] bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2.5"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="8" cy="8" r="6" /><path d="M8 5v3M8 11h.01" />
                  </svg>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={!loading ? { scale: 1.01 } : {}}
              whileTap={!loading ? { scale: 0.99 } : {}}
              disabled={loading}
              onClick={handleLogin}
              className={`
                w-full py-3 rounded-xl text-[14px] font-medium transition-all duration-200
                ${loading
                  ? 'bg-teal-500/30 text-teal-300/50 cursor-not-allowed'
                  : 'bg-teal-500 text-white hover:bg-teal-400 shadow-lg shadow-teal-500/20'
                }
              `}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="inline-block w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full"
                  />
                  Signing in…
                </span>
              ) : 'Sign in'}
            </motion.button>

          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="text-center text-[13px] text-white/30 mt-5"
        >
          No account?{' '}
          <button
            onClick={onSwitch}
            className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
          >
            Create one
          </button>
        </motion.p>

      </motion.div>
    </div>
  )
}


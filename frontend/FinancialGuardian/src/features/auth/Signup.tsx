import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { motion } from 'framer-motion'

export function Signup({ onSwitch }: { onSwitch: () => void }) {
  const signup = useAuthStore((s) => s.signup)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [focused, setFocused] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    setLoading(true)
    try {
      await signup(name, email, password)
      onSwitch()
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { id: 'name',     label: 'Full name', type: 'text',     value: name,     set: setName,     placeholder: 'Jane Smith' },
    { id: 'email',    label: 'Email',     type: 'email',    value: email,    set: setEmail,    placeholder: 'you@example.com' },
    { id: 'password', label: 'Password',  type: 'password', value: password, set: setPassword, placeholder: '••••••••' },
  ]

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0c0c0f] overflow-hidden">

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-[500px] h-[400px] rounded-full bg-teal-500/5 blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-indigo-500/5 blur-[100px]" />
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
          <h1 className="text-[28px] font-semibold text-white tracking-tight">
            Start effortlessly
          </h1>
          <p className="text-[14px] text-white/40 mt-1.5">
            Your AI co-pilot for financial clarity
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-sm"
        >
          <div className="space-y-4">

            {fields.map((field, i) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.06, duration: 0.3 }}
                className="space-y-1.5"
              >
                <label className="text-[12px] font-medium text-white/40 uppercase tracking-wider">
                  {field.label}
                </label>
                <div className={`rounded-xl border transition-all duration-200 ${
                  focused === field.id
                    ? 'border-teal-500/50 bg-teal-500/5'
                    : 'border-white/10 bg-white/[0.03]'
                }`}>
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={(e) => field.set(e.target.value)}
                    onFocus={() => setFocused(field.id)}
                    onBlur={() => setFocused(null)}
                    placeholder={field.placeholder}
                    className="w-full bg-transparent px-4 py-3 text-[14px] text-white placeholder-white/20 outline-none"
                  />
                </div>
              </motion.div>
            ))}

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              whileHover={!loading ? { scale: 1.01 } : {}}
              whileTap={!loading ? { scale: 0.99 } : {}}
              disabled={loading}
              onClick={handleSignup}
              className={`
                w-full py-3 rounded-xl text-[14px] font-medium transition-all duration-200 mt-2
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
                  Creating account…
                </span>
              ) : 'Create account'}
            </motion.button>

          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="text-center text-[13px] text-white/30 mt-5"
        >
          Already have an account?{' '}
          <button
            onClick={onSwitch}
            className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
          >
            Sign in
          </button>
        </motion.p>

      </motion.div>
    </div>
  )
}

import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { motion } from 'framer-motion'

export function Login({ onSwitch }: { onSwitch: () => void }) {
  const login = useAuthStore((s) => s.login)
  const loading = useAuthStore((s) => s.loading)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    try {
      setError(null)
      await login(email, password)
    } catch (e: any) {
      setError(e.message || 'Login failed')
    }
  }

  return (
    <div className="max-w-sm mx-auto space-y-4 p-6">

      <h1 className="text-xl font-semibold">Login</h1>

      <input
        className="w-full p-2 border rounded"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="w-full p-2 border rounded"
        type="password"
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <motion.button
        whileHover={!loading ? { scale: 1.03 } : {}}
        whileTap={!loading ? { scale: 0.97 } : {}}
        disabled={loading}
        className="w-full bg-black text-white p-2 rounded"
        onClick={handleLogin}
      >
        {loading ? 'Logging in...' : 'Login'}
      </motion.button>

      <p className="text-sm text-center text-gray-500">
        Don’t have an account?{' '}
        <button onClick={onSwitch} className="font-medium hover:underline">
          Sign up
        </button>
      </p>
    </div>
  )
}
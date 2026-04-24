import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { motion } from 'framer-motion'

export function Signup({ onSwitch }: { onSwitch: () => void }) {
  const signup = useAuthStore((s) => s.signup)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSignup = async () => {
    await signup(name, email, password)

    // 🔥 IMPORTANT: force login screen
    onSwitch()
  }

  return (
    <div className="max-w-sm mx-auto space-y-4 p-6">

      <h1 className="text-xl font-semibold">Create account</h1>

      <input value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded" placeholder="name" />
      <input value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded" placeholder="email" />
      <input value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded" placeholder="password" type="password" />

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="w-full bg-black text-white p-2 rounded"
        onClick={handleSignup}
      >
        Sign up
      </motion.button>

      <p className="text-sm text-center text-gray-500">
        Already have an account?{' '}
        <button onClick={onSwitch} className="font-medium hover:underline">
          Login
        </button>
      </p>
    </div>
  )
}
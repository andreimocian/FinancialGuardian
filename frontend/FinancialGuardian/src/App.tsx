import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { FinancialFeature } from '@/features/financial'
import { Login } from '@/features/auth/Login'
import { Signup } from '@/features/auth/Signup'

type Mode = 'login' | 'signup'

export default function App() {
  const user = useAuthStore((s) => s.user)
  const initialized = useAuthStore((s) => s.initialized)
  const fetchMe = useAuthStore((s) => s.fetchMe)

  const [mode, setMode] = useState<Mode>('login')

  useEffect(() => {
    fetchMe()
  }, [])

  if (!initialized) {
    return <div className="h-screen flex items-center justify-center">Loading session...</div>
  }

  if (user) {
    return <FinancialFeature />
  }

  return mode === 'login' ? (
    <Login onSwitch={() => setMode('signup')} />
  ) : (
    <Signup onSwitch={() => setMode('login')} />
  )
}
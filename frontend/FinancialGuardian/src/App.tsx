import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { FinancialFeature } from '@/features/financial/index'
import { Login } from '@/features/auth/Login'
import { Signup } from '@/features/auth/Signup'
import Bills from '@/features/contracts'
import ContractsPage from '@/features/contractsPage'
import Watchdog from '@/features/watchdog'
import { PageShell } from '@/components/ui/layout/PageShell'
import type { NavItem } from '@/components/ui/layout/PageShell'
import { AnimatePresence, motion } from 'framer-motion'

type Mode    = 'login' | 'signup'
type Feature = 'financial' | 'bills' | 'contractsPage' | 'watchdog'

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  {
    id: 'financial', label: 'Overview',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="5" height="5" rx="1" /><rect x="9" y="2" width="5" height="5" rx="1" />
        <rect x="2" y="9" width="5" height="5" rx="1" /><rect x="9" y="9" width="5" height="5" rx="1" />
      </svg>
    ),
  },
  {
    id: 'bills', label: 'Bills',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4h12v10H2zM2 4l2-2h8l2 2M5 8h6M5 11h4" />
      </svg>
    ),
  },
  {
    id: 'contractsPage', label: 'Contracts',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V5L10 2z" />
        <path d="M10 2v3h3M5 9h6M5 11.5h4" />
      </svg>
    ),
  },
  {
    id: 'watchdog', label: 'Watchdog',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="6" />
        <path d="M8 5v3l2 2" />
      </svg>
    ),
  },
]

// ─── Loading screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0c0c0f] flex items-center justify-center">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-teal-500/5 blur-[120px]" />
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative flex flex-col items-center gap-5">
        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2l5 2v4c0 3-2.5 5-5 6C5.5 13 3 11 3 8V4l5-2z" />
          </svg>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-teal-400"
              animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
          ))}
        </div>
        <p className="text-[12px] text-white/25 tracking-widest uppercase">Restoring session</p>
      </motion.div>
    </div>
  )
}

// ─── Logout button ────────────────────────────────────────────────────────────

function LogoutButton() {
  const logout = useAuthStore(s => s.logout)
  return (
    <button onClick={logout} title="Sign out"
      className="flex items-center justify-center w-10 h-10 mx-auto rounded-xl text-white/20 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-150">
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 8H2M6 4l-4 4 4 4M11 4h2a1 1 0 011 1v6a1 1 0 01-1 1h-2" />
      </svg>
    </button>
  )
}

// ─── App shell ────────────────────────────────────────────────────────────────

function AppShell() {
  const [active, setActive] = useState<Feature>('financial')

  return (
    <PageShell
      navItems={NAV_ITEMS}
      defaultActiveNav="financial"
      defaultSidebarOpen={false}
      onNavChange={id => setActive(id as Feature)}
      sidebarFooter={<LogoutButton />}
    >
      <AnimatePresence mode="wait">
        {active === 'financial' && (
          <motion.div key="financial" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
            <FinancialFeature />
          </motion.div>
        )}
        {active === 'bills' && (
          <motion.div key="bills" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
            <Bills />
          </motion.div>
        )}
        {active === 'contractsPage' && (
          <motion.div key="contractsPage" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
            <ContractsPage />
          </motion.div>
        )}
        {active === 'watchdog' && (
          <motion.div key="watchdog" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
            <Watchdog />
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const user        = useAuthStore(s => s.user)
  const initialized = useAuthStore(s => s.initialized)
  const fetchMe     = useAuthStore(s => s.fetchMe)
  const [mode, setMode] = useState<Mode>('login')

  useEffect(() => { fetchMe() }, [fetchMe])

  if (!initialized) return <LoadingScreen />

  return (
    <AnimatePresence mode="wait">
      {user ? (
        <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <AppShell />
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

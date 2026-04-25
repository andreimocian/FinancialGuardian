import { useState, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export type NavItem = {
  id: string
  label: string
  icon: React.ReactNode
  badge?: number | string
}

type PageShellContextValue = {
  sidebarOpen:    boolean
  setSidebarOpen: (open: boolean) => void
  activeNav:      string
  setActiveNav:   (id: string) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const PageShellContext = createContext<PageShellContextValue | null>(null)

export function usePageShell() {
  const ctx = useContext(PageShellContext)
  if (!ctx) throw new Error('usePageShell must be used inside <PageShell>')
  return ctx
}

// ─── Variants ─────────────────────────────────────────────────────────────────

const sidebarVariants = {
  open:   { width: 220, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
  closed: { width: 64,  transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
}

const labelVariants = {
  open:   { opacity: 1, x: 0,  transition: { delay: 0.08, duration: 0.18 } },
  closed: { opacity: 0, x: -6, transition: { duration: 0.1 } },
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  navItems: NavItem[]
  logo?:    React.ReactNode
  footer?:  React.ReactNode
  onNavChange?: (id: string) => void
}

function Sidebar({ navItems, logo, footer, onNavChange }: SidebarProps) {
  const { sidebarOpen, setSidebarOpen, activeNav, setActiveNav } = usePageShell()

  const handleNav = (id: string) => {
    setActiveNav(id)
    onNavChange?.(id)
  }

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={sidebarOpen ? 'open' : 'closed'}
      initial={false}
      className="relative flex flex-col h-full shrink-0 overflow-hidden bg-[#0c0c0f] border-r border-white/[0.06]"
    >
      {/* Logo + collapse toggle */}
      <div className="flex items-center justify-between px-4 h-14 shrink-0 border-b border-white/[0.06]">
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.div
              key="logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.1 } }}
              exit={{ opacity: 0, transition: { duration: 0.08 } }}
              className="overflow-hidden"
            >
              {logo ?? (
                <span className="text-[15px] font-medium tracking-tight text-white/90 whitespace-nowrap">
                  guardian<span className="text-teal-400">.</span>
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-colors duration-150',
            'text-white/25 hover:text-white/60 hover:bg-white/[0.05]',
            !sidebarOpen && 'mx-auto',
          )}
        >
          <CollapseIcon open={sidebarOpen} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 px-2 py-4 flex-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = activeNav === item.id
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              title={!sidebarOpen ? item.label : undefined}
              className={cn(
                'relative flex items-center gap-3 w-full h-9 px-2.5 rounded-xl',
                'text-left text-[13.5px] font-[450] transition-all duration-150',
                isActive
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                  : 'text-white/30 hover:text-white/60 hover:bg-white/[0.05]',
              )}
            >
              {/* Active pip */}
              {isActive && (
                <motion.span
                  layoutId="nav-pip"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r-full bg-teal-400"
                />
              )}

              <span className="shrink-0 w-4 h-4 flex items-center justify-center">
                {item.icon}
              </span>

              <motion.span
                variants={labelVariants}
                animate={sidebarOpen ? 'open' : 'closed'}
                className="whitespace-nowrap overflow-hidden"
              >
                {item.label}
              </motion.span>

              {/* Badge */}
              {item.badge !== undefined && sidebarOpen && (
                <motion.span
                  variants={labelVariants}
                  animate={sidebarOpen ? 'open' : 'closed'}
                  className={cn(
                    'ml-auto shrink-0 min-w-[18px] h-[18px] px-1 rounded-full',
                    'flex items-center justify-center text-[11px] font-medium',
                    isActive
                      ? 'bg-teal-400/20 text-teal-300'
                      : 'bg-white/[0.07] text-white/40',
                  )}
                >
                  {item.badge}
                </motion.span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer slot */}
      {footer && (
        <div className="px-2 py-3 border-t border-white/[0.06] shrink-0">
          {footer}
        </div>
      )}
    </motion.aside>
  )
}

// ─── PageShell ────────────────────────────────────────────────────────────────

interface PageShellProps {
  navItems:           NavItem[]
  logo?:              React.ReactNode
  sidebarFooter?:     React.ReactNode
  defaultActiveNav?:  string
  defaultSidebarOpen?: boolean
  onNavChange?:       (id: string) => void
  children:           React.ReactNode
  className?:         string
}

export function PageShell({
  navItems,
  logo,
  sidebarFooter,
  defaultActiveNav,
  defaultSidebarOpen = true,
  onNavChange,
  children,
  className,
}: PageShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(defaultSidebarOpen)
  const [activeNav,   setActiveNav]   = useState(defaultActiveNav ?? navItems[0]?.id ?? '')

  return (
    <PageShellContext.Provider value={{ sidebarOpen, setSidebarOpen, activeNav, setActiveNav }}>
      <div className={cn('flex h-screen w-full overflow-hidden bg-[#0c0c0f]', className)}>

        <Sidebar
          navItems={navItems}
          logo={logo}
          footer={sidebarFooter}
          onNavChange={onNavChange}
        />

        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
          {children}
        </main>

      </div>
    </PageShellContext.Provider>
  )
}

// ─── CollapseIcon ─────────────────────────────────────────────────────────────

function CollapseIcon({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 8h10" />
      <motion.path
        d={open ? 'M10 5l-3 3 3 3' : 'M6 5l3 3-3 3'}
        animate={{ d: open ? 'M10 5l-3 3 3 3' : 'M6 5l3 3-3 3' }}
        transition={{ duration: 0.2 }}
      />
    </svg>
  )
}

export default PageShell

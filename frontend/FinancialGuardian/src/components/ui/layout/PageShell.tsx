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
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  activeNav: string
  setActiveNav: (id: string) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const PageShellContext = createContext<PageShellContextValue | null>(null)

export function usePageShell() {
  const ctx = useContext(PageShellContext)
  if (!ctx) throw new Error('usePageShell must be used inside <PageShell>')
  return ctx
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

const sidebarVariants = {
  open: { width: 220, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
  closed: { width: 64, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
}

const labelVariants = {
  open: { opacity: 1, x: 0, transition: { delay: 0.08, duration: 0.18 } },
  closed: { opacity: 0, x: -6, transition: { duration: 0.1 } },
}

interface SidebarProps {
  navItems: NavItem[]
  logo?: React.ReactNode
  footer?: React.ReactNode
}

function Sidebar({ navItems, logo, footer }: SidebarProps) {
  const { sidebarOpen, setSidebarOpen, activeNav, setActiveNav } = usePageShell()

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={sidebarOpen ? 'open' : 'closed'}
      initial={false}
      className={cn(
        'relative flex flex-col h-full shrink-0 overflow-hidden',
        'bg-white border-r border-stone-100 dark:bg-neutral-950 dark:border-neutral-800',
      )}
    >
      {/* Logo + toggle */}
      <div className="flex items-center justify-between px-4 h-14 shrink-0 border-b border-stone-100 dark:border-neutral-800">
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
                <span className="text-[15px] font-medium tracking-tight text-stone-900 dark:text-stone-100 whitespace-nowrap">
                  guardian
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg shrink-0',
            'text-stone-400 hover:text-stone-700 hover:bg-stone-50',
            'dark:text-neutral-500 dark:hover:text-neutral-200 dark:hover:bg-neutral-800',
            'transition-colors duration-150',
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
              onClick={() => setActiveNav(item.id)}
              title={!sidebarOpen ? item.label : undefined}
              className={cn(
                'relative flex items-center gap-3 w-full h-9 px-2.5 rounded-lg',
                'text-left text-[13.5px] font-[450] transition-colors duration-150',
                isActive
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100',
              )}
            >
              {/* Active indicator pip */}
              {isActive && (
                <motion.span
                  layoutId="nav-pip"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-teal-400"
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
                      ? 'bg-white/20 text-white'
                      : 'bg-stone-100 text-stone-500 dark:bg-neutral-700 dark:text-neutral-300',
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
        <div className="px-2 py-3 border-t border-stone-100 dark:border-neutral-800 shrink-0">
          {footer}
        </div>
      )}
    </motion.aside>
  )
}

// ─── Top bar ─────────────────────────────────────────────────────────────────

interface TopBarProps {
  title?: string
  actions?: React.ReactNode
}

function TopBar({ title, actions }: TopBarProps) {
  return (
    <header className="flex items-center justify-between h-14 px-6 shrink-0 border-b border-stone-100 dark:border-neutral-800 bg-white dark:bg-neutral-950">
      {title && (
        <h1 className="text-[15px] font-medium text-stone-800 dark:text-stone-100">
          {title}
        </h1>
      )}
      {actions && (
        <div className="flex items-center gap-2 ml-auto">{actions}</div>
      )}
    </header>
  )
}

// ─── PageShell ────────────────────────────────────────────────────────────────

interface PageShellProps {
  navItems: NavItem[]
  logo?: React.ReactNode
  sidebarFooter?: React.ReactNode
  topBarTitle?: string
  topBarActions?: React.ReactNode
  defaultActiveNav?: string
  defaultSidebarOpen?: boolean
  children: React.ReactNode
  className?: string
}

export function PageShell({
  navItems,
  logo,
  sidebarFooter,
  topBarTitle,
  topBarActions,
  defaultActiveNav,
  defaultSidebarOpen = true,
  children,
  className,
}: PageShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(defaultSidebarOpen)
  const [activeNav, setActiveNav] = useState(defaultActiveNav ?? navItems[0]?.id ?? '')

  return (
    <PageShellContext.Provider value={{ sidebarOpen, setSidebarOpen, activeNav, setActiveNav }}>
      <div
        className={cn(
          'flex h-screen w-full overflow-hidden',
          'bg-stone-50 dark:bg-neutral-900',
          className,
        )}
      >
        <Sidebar navItems={navItems} logo={logo} footer={sidebarFooter} />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <TopBar title={topBarTitle} actions={topBarActions} />

          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </PageShellContext.Provider>
  )
}

// ─── CollapseIcon ─────────────────────────────────────────────────────────────

function CollapseIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <motion.path
        d="M3 8h10"
        animate={{ opacity: 1 }}
      />
      <motion.path
        d={open ? 'M10 5l-3 3 3 3' : 'M6 5l3 3-3 3'}
        animate={{ d: open ? 'M10 5l-3 3 3 3' : 'M6 5l3 3-3 3' }}
        transition={{ duration: 0.2 }}
      />
    </svg>
  )
}

export default PageShell

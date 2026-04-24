import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type EmptyStateVariant =
  | 'default'     // generic "nothing here yet"
  | 'ai-working'  // AI is processing, will populate soon
  | 'all-clear'   // everything is fine, nothing flagged
  | 'search'      // no search results

interface EmptyStateProps {
  variant?: EmptyStateVariant
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconDefault() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  )
}

function IconAllClear() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  )
}

// ─── AI working dots ─────────────────────────────────────────────────────────

function AiWorkingDots() {
  return (
    <div className="flex gap-[5px] items-center">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-[7px] h-[7px] rounded-full bg-teal-400 dark:bg-teal-500"
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            delay: i * 0.22,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ─── Variant config ───────────────────────────────────────────────────────────

const variantDefaults: Record<
  EmptyStateVariant,
  { title: string; description: string; iconColor: string }
> = {
  default: {
    title: 'Nothing here yet',
    description: 'Data will appear here once the guardian starts watching.',
    iconColor: 'text-stone-300 dark:text-neutral-600',
  },
  'ai-working': {
    title: 'Guardian is working',
    description: 'Analyzing your transaction stream — results will surface shortly.',
    iconColor: 'text-teal-400 dark:text-teal-500',
  },
  'all-clear': {
    title: 'All clear',
    description: 'No flags, no drift, no wasted spend detected this week.',
    iconColor: 'text-teal-400 dark:text-teal-500',
  },
  search: {
    title: 'No results',
    description: 'Try a different search term or clear your filters.',
    iconColor: 'text-stone-300 dark:text-neutral-600',
  },
}

const iconMap: Record<EmptyStateVariant, React.ReactNode> = {
  default: <IconDefault />,
  'ai-working': null, // replaced by dots
  'all-clear': <IconAllClear />,
  search: <IconSearch />,
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

export function EmptyState({
  variant = 'default',
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const defaults = variantDefaults[variant]
  const resolvedTitle = title ?? defaults.title
  const resolvedDesc = description ?? defaults.description
  const { iconColor } = defaults
  const icon = iconMap[variant]

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'px-8 py-12 gap-4 w-full h-full',
        className,
      )}
    >
      {/* Icon / dots */}
      <div
        className={cn(
          'flex items-center justify-center',
          'w-12 h-12 rounded-2xl',
          variant === 'all-clear'
            ? 'bg-teal-50 dark:bg-teal-950/40'
            : 'bg-stone-50 dark:bg-neutral-800',
          iconColor,
        )}
      >
        {variant === 'ai-working' ? <AiWorkingDots /> : icon}
      </div>

      {/* Text */}
      <div className="max-w-[260px]">
        <p className="text-[14px] font-medium text-stone-700 dark:text-stone-300">
          {resolvedTitle}
        </p>
        <p className="mt-1 text-[13px] text-stone-400 dark:text-neutral-500 leading-relaxed">
          {resolvedDesc}
        </p>
      </div>

      {/* Optional action */}
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            'mt-1 text-[13px] font-medium px-4 py-2 rounded-lg',
            'text-stone-600 dark:text-neutral-300',
            'border border-stone-200 dark:border-neutral-700',
            'hover:bg-stone-50 dark:hover:bg-neutral-800',
            'transition-colors duration-150',
          )}
        >
          {action.label}
        </button>
      )}
    </motion.div>
  )
}

export default EmptyState

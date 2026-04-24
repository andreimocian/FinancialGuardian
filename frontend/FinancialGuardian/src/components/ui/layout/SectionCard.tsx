import { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '../../../lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SectionCardProps extends HTMLMotionProps<'div'> {
  /** Card title shown in the header */
  title?: string
  /** Subtitle / description beneath the title */
  description?: string
  /** Actions rendered in the top-right of the header (buttons, badges, etc.) */
  headerActions?: React.ReactNode
  /** Content below the header divider */
  children?: React.ReactNode
  /** Remove the default padding from the body (useful for flush tables/lists) */
  noPadding?: boolean
  /** Show a subtle AI-thinking shimmer animation */
  loading?: boolean
  /** Visual accent: none (default), teal (success/on-track), amber (warning/drift) */
  accent?: 'none' | 'teal' | 'amber' | 'coral'
  className?: string
  bodyClassName?: string
}

// ─── Accent map ───────────────────────────────────────────────────────────────

const accentBorder: Record<NonNullable<SectionCardProps['accent']>, string> = {
  none: '',
  teal: 'border-t-[2px] border-t-teal-500',
  amber: 'border-t-[2px] border-t-amber-400',
  coral: 'border-t-[2px] border-t-rose-400',
}

// ─── Shimmer ─────────────────────────────────────────────────────────────────

function Shimmer() {
  return (
    <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
      <motion.div
        className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/40 dark:via-white/5 to-transparent"
        animate={{ translateX: ['−100%', '200%'] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.4 }}
      />
    </div>
  )
}

// ─── SectionCard ─────────────────────────────────────────────────────────────

export const SectionCard = forwardRef<HTMLDivElement, SectionCardProps>(
  function SectionCard(
    {
      title,
      description,
      headerActions,
      children,
      noPadding = false,
      loading = false,
      accent = 'none',
      className,
      bodyClassName,
      ...motionProps
    },
    ref,
  ) {
    const hasHeader = title || description || headerActions

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          'relative rounded-2xl overflow-hidden',
          'bg-white dark:bg-neutral-900',
          'border border-stone-100 dark:border-neutral-800',
          accentBorder[accent],
          className,
        )}
        {...motionProps}
      >
        {loading && <Shimmer />}

        {hasHeader && (
          <div
            className={cn(
              'flex items-start justify-between gap-4',
              'px-6 py-4',
              children && 'border-b border-stone-100 dark:border-neutral-800',
            )}
          >
            {(title || description) && (
              <div className="min-w-0">
                {title && (
                  <h2 className="text-[14px] font-medium text-stone-800 dark:text-stone-100 truncate">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="text-[13px] text-stone-400 dark:text-neutral-500 mt-0.5 leading-snug">
                    {description}
                  </p>
                )}
              </div>
            )}

            {headerActions && (
              <div className="flex items-center gap-2 shrink-0 mt-0.5">
                {headerActions}
              </div>
            )}
          </div>
        )}

        {children && (
          <div className={cn(!noPadding && 'px-6 py-4', bodyClassName)}>
            {children}
          </div>
        )}
      </motion.div>
    )
  },
)

// ─── SectionCard.Group ────────────────────────────────────────────────────────
// Staggered grid of SectionCards — use for dashboard layouts

interface SectionCardGroupProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
  className?: string
}

const colClass: Record<NonNullable<SectionCardGroupProps['columns']>, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
}

const groupVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
}

export function SectionCardGroup({
  children,
  columns = 2,
  className,
}: SectionCardGroupProps) {
  return (
    <motion.div
      variants={groupVariants}
      initial="hidden"
      animate="visible"
      className={cn('grid gap-4', colClass[columns], className)}
    >
      {children}
    </motion.div>
  )
}

export default SectionCard

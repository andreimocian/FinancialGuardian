import { useRef, useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'


interface SplitPaneProps {
  list: React.ReactNode
  detail: React.ReactNode | null
  emptyState?: React.ReactNode
  initialSplit?: number
  minLeft?: number
  maxLeftFraction?: number
  stackBelow?: 'sm' | 'md' | 'lg'
  className?: string
  listClassName?: string
  detailClassName?: string
}


function DragHandle({ onDrag }: { onDrag: (dx: number) => void }) {
  const dragging = useRef(false)
  const lastX = useRef(0)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    lastX.current = e.clientX
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      onDrag(e.clientX - lastX.current)
      lastX.current = e.clientX
    }
    const onMouseUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [onDrag])

  return (
    <div
      onMouseDown={onMouseDown}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize panels"
      className={cn(
        'relative flex items-center justify-center w-[1px] shrink-0',
        'bg-stone-100 dark:bg-neutral-800',
        'hover:bg-teal-400 dark:hover:bg-teal-600',
        'cursor-col-resize group transition-colors duration-150',
        'select-none z-10',
      )}
    >
      <div className="absolute inset-y-0 -inset-x-2" />
      <div
        className={cn(
          'absolute flex flex-col gap-[3px] opacity-0 group-hover:opacity-100 transition-opacity',
          'bg-white dark:bg-neutral-900 rounded-full px-[3px] py-[6px] border border-stone-200 dark:border-neutral-700',
        )}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-[3px] h-[3px] rounded-full bg-stone-400 dark:bg-neutral-500"
          />
        ))}
      </div>
    </div>
  )
}


function DefaultEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
      <div className="w-10 h-10 rounded-full bg-stone-50 dark:bg-neutral-800 flex items-center justify-center">
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-stone-300 dark:text-neutral-600"
        >
          <path d="M9 3v6l4 2" />
          <circle cx="9" cy="9" r="7" />
        </svg>
      </div>
      <p className="text-[13px] text-stone-400 dark:text-neutral-500 leading-relaxed">
        Select an item to see details
      </p>
    </div>
  )
}


export function SplitPane({
  list,
  detail,
  emptyState,
  initialSplit = 0.38,
  minLeft = 240,
  maxLeftFraction = 0.65,
  className,
  listClassName,
  detailClassName,
}: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [splitFraction, setSplitFraction] = useState(initialSplit)

  const handleDrag = useCallback(
    (dx: number) => {
      const container = containerRef.current
      if (!container) return
      const totalWidth = container.offsetWidth
      const newLeft = splitFraction * totalWidth + dx
      const clamped = Math.max(minLeft, Math.min(newLeft, totalWidth * maxLeftFraction))
      setSplitFraction(clamped / totalWidth)
    },
    [splitFraction, minLeft, maxLeftFraction],
  )

  const leftPercent = `${(splitFraction * 100).toFixed(2)}%`
  const rightPercent = `${((1 - splitFraction) * 100).toFixed(2)}%`

  return (
    <div
      ref={containerRef}
      className={cn('flex h-full overflow-hidden', className)}
    >
      <div
        style={{ width: leftPercent }}
        className={cn(
          'flex flex-col shrink-0 overflow-hidden',
          'border-r border-stone-100 dark:border-neutral-800',
          listClassName,
        )}
      >
        {list}
      </div>

      <DragHandle onDrag={handleDrag} />

      <div
        style={{ width: rightPercent }}
        className={cn(
          'flex-1 min-w-0 overflow-y-auto overflow-x-hidden',
          detailClassName,
        )}
      >
        <AnimatePresence mode="wait">
          {detail ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="h-full"
            >
              {detail}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {emptyState ?? <DefaultEmptyState />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default SplitPane

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { FinancialSnapshot } from '../types'

interface Props {
  snapshot: FinancialSnapshot
}

function daysRemainingInMonth(): number {
  const now  = new Date()
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return last.getDate() - now.getDate() + 1
}

function dayOfMonth(): number {
  return new Date().getDate()
}

function daysInMonth(): number {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
}

export function DailyLimitCard({ snapshot }: Props) {
  const { safeToSpend, expenses } = snapshot

  const total        = daysInMonth()
  const today        = dayOfMonth()
  const remaining    = daysRemainingInMonth()
  const dailyLimit   = remaining > 0 ? safeToSpend / remaining : 0

  const avgDailySpent = today > 0 ? expenses / today : 0
  const isOverLimit   = avgDailySpent > dailyLimit && dailyLimit > 0

  const chartData = useMemo(() => {
    const points: { day: number; actual: number | null; forecast: number | null; limit: number }[] = []

    for (let d = 1; d <= total; d++) {
      const limit = dailyLimit

      if (d < today) {
        points.push({ day: d, actual: avgDailySpent, forecast: null, limit })
      } else if (d === today) {
        points.push({ day: d, actual: avgDailySpent, forecast: avgDailySpent, limit })
      } else {
        points.push({ day: d, actual: null, forecast: avgDailySpent, limit })
      }
    }
    return points
  }, [total, today, avgDailySpent, dailyLimit])

  const maxY = Math.max(dailyLimit * 1.4, avgDailySpent * 1.4, 10)

  const W = 560; const H = 140
  const PAD = { top: 12, right: 16, bottom: 28, left: 44 }
  const CW = W - PAD.left - PAD.right
  const CH = H - PAD.top - PAD.bottom

  const xScale = (day: number) => PAD.left + ((day - 1) / (total - 1)) * CW
  const yScale = (val: number) => PAD.top + CH - (val / maxY) * CH

  const actualPoints  = chartData.filter(p => p.actual  !== null)
  const forecastPoints = chartData.filter(p => p.forecast !== null)

  const toPath = (pts: typeof chartData, key: 'actual' | 'forecast') =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.day).toFixed(1)} ${yScale(p[key] as number).toFixed(1)}`).join(' ')

  const limitY = yScale(dailyLimit).toFixed(1)

  const xLabels = [1, Math.round(total * 0.25), Math.round(total * 0.5), Math.round(total * 0.75), total]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.4 }}
      className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden"
    >
      <div className="flex items-start justify-between px-6 py-5 border-b border-white/[0.07]">
        <div>
          <p className="text-[11px] text-white/35 uppercase tracking-widest mb-1.5">Daily limit</p>
          <div className="flex items-baseline gap-2">
            <p className={`text-[36px] font-semibold font-mono tracking-tight ${
              isOverLimit ? 'text-rose-400' : 'text-teal-400'
            }`}>
              €{dailyLimit.toFixed(2)}
            </p>
            <span className="text-[13px] text-white/30">/ day</span>
          </div>
          <p className="text-[12px] text-white/30 mt-1">
            €{safeToSpend.toFixed(2)} safe to spend ÷ {remaining} days left in month
          </p>
        </div>

        <div className={`px-3 py-1.5 rounded-xl border text-[12px] font-medium ${
          isOverLimit
            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            : 'bg-teal-500/10 border-teal-500/20 text-teal-400'
        }`}>
          {isOverLimit ? 'Over limit' : 'On track'}
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-white/[0.06] border-b border-white/[0.07]">
        {[
          { label: 'Avg daily spent', value: `€${avgDailySpent.toFixed(2)}`, color: isOverLimit ? 'text-rose-400' : 'text-white/70' },
          { label: 'Day of month', value: `${today} / ${total}`, color: 'text-white/70' },
          { label: 'Days remaining', value: String(remaining), color: 'text-white/70' },
        ].map(s => (
          <div key={s.label} className="px-5 py-3">
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-[15px] font-mono font-medium ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="px-4 pt-4 pb-2">
        <p className="text-[11px] text-white/25 uppercase tracking-wider px-2 mb-2">
          Daily spend forecast
        </p>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          role="img"
          aria-label="Daily spending forecast chart showing actual spend versus daily limit"
        >
          {[0, 0.25, 0.5, 0.75, 1].map(f => {
            const val = maxY * f
            const y   = yScale(val).toFixed(1)
            return (
              <g key={f}>
                <line
                  x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                  stroke="rgba(255,255,255,0.05)" strokeWidth="1"
                />
                <text x={PAD.left - 6} y={parseFloat(y) + 4} textAnchor="end"
                  fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="monospace">
                  €{val.toFixed(0)}
                </text>
              </g>
            )
          })}

          <line
            x1={PAD.left} y1={limitY} x2={W - PAD.right} y2={limitY}
            stroke="#2dd4bf" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6"
          />
          <text
            x={W - PAD.right + 4} y={parseFloat(limitY) + 4}
            fill="#2dd4bf" fontSize="9" fontFamily="monospace" opacity="0.7"
          >
            limit
          </text>

          <line
            x1={xScale(today).toFixed(1)} y1={PAD.top}
            x2={xScale(today).toFixed(1)} y2={H - PAD.bottom}
            stroke="rgba(255,255,255,0.15)" strokeWidth="1"
          />

          {forecastPoints.length > 1 && (() => {
            const firstX = xScale(forecastPoints[0].day)
            const lastX  = xScale(forecastPoints[forecastPoints.length - 1].day)
            const areaPath = [
              `M ${firstX.toFixed(1)} ${H - PAD.bottom}`,
              ...forecastPoints.map(p => `L ${xScale(p.day).toFixed(1)} ${yScale(p.forecast!).toFixed(1)}`),
              `L ${lastX.toFixed(1)} ${H - PAD.bottom}`,
              'Z'
            ].join(' ')
            return (
              <path
                d={areaPath}
                fill={isOverLimit ? 'rgba(251,113,133,0.08)' : 'rgba(45,212,191,0.06)'}
              />
            )
          })()}

          {forecastPoints.length > 1 && (
            <path
              d={toPath(forecastPoints, 'forecast')}
              fill="none"
              stroke={isOverLimit ? '#fb7185' : '#2dd4bf'}
              strokeWidth="1.5"
              strokeDasharray="5 4"
              opacity="0.5"
            />
          )}

          {actualPoints.length > 1 && (
            <path
              d={toPath(actualPoints, 'actual')}
              fill="none"
              stroke={isOverLimit ? '#fb7185' : '#2dd4bf'}
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}

          <circle
            cx={xScale(today).toFixed(1)}
            cy={yScale(avgDailySpent).toFixed(1)}
            r="4"
            fill={isOverLimit ? '#fb7185' : '#2dd4bf'}
          />

          {xLabels.map(d => (
            <text
              key={d}
              x={xScale(d).toFixed(1)}
              y={H - PAD.bottom + 14}
              textAnchor="middle"
              fill="rgba(255,255,255,0.25)"
              fontSize="9"
              fontFamily="monospace"
            >
              {d}
            </text>
          ))}

          <line
            x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom}
            stroke="rgba(255,255,255,0.08)" strokeWidth="1"
          />
        </svg>

        <div className="flex items-center gap-5 px-2 pb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-[2px] rounded-full" style={{ backgroundColor: '#2dd4bf' }} />
            <span className="text-[10px] text-white/30">Actual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="20" height="2"><line x1="0" y1="1" x2="20" y2="1" stroke="#2dd4bf" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" /></svg>
            <span className="text-[10px] text-white/30">Forecast</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="20" height="2"><line x1="0" y1="1" x2="20" y2="1" stroke="#2dd4bf" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" /></svg>
            <span className="text-[10px] text-white/30">Daily limit</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

'use client'

import { useQuota }   from '@/hooks/useQuota'
import { FREE_LIMIT } from '@/lib/usage'
import { clsx }       from 'clsx'

interface QuotaCounterProps {
  onLimitClick?: () => void
}

export function QuotaCounter({ onLimitClick }: QuotaCounterProps) {
  const { used, remaining, isAtLimit, isWarning, isPro } = useQuota()

  // ── Pro badge ─────────────────────────────────────────────────────────────
  if (isPro) {
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-ink-200 bg-ink-50 px-2.5 py-1 text-[11px] font-semibold text-ink-700">
        <span className="text-[10px]">✦</span>
        Pro Plan
      </span>
    )
  }

  // ── Free badge ────────────────────────────────────────────────────────────
  const fraction   = Math.min(1, used / FREE_LIMIT)
  const colorClass = isAtLimit ? 'stroke-red-500' : isWarning ? 'stroke-amber-500' : 'stroke-ink-500'
  const trackClass = isAtLimit ? 'stroke-red-200' : isWarning ? 'stroke-amber-200' : 'stroke-gray-200'

  return (
    <button
      onClick={isAtLimit ? onLimitClick : undefined}
      title={isAtLimit ? 'Export limit reached — click to upgrade' : `${remaining} of ${FREE_LIMIT} free pages remaining`}
      aria-label={isAtLimit ? 'Export limit reached' : `${remaining} of ${FREE_LIMIT} export pages remaining`}
      suppressHydrationWarning
      className={clsx(
        'flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1',
        isAtLimit
          ? 'cursor-pointer border-red-200 bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-400'
          : isWarning
          ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 focus:ring-amber-400'
          : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 focus:ring-gray-300'
      )}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0 -rotate-90" aria-hidden>
        <circle cx="7" cy="7" r="5" fill="none" strokeWidth="2" className={trackClass} />
        <circle
          cx="7" cy="7" r="5" fill="none" strokeWidth="2" strokeLinecap="round"
          strokeDasharray={String(2 * Math.PI * 5)}
          strokeDashoffset={String(2 * Math.PI * 5 * (1 - fraction))}
          className={clsx(colorClass, 'transition-all duration-500')}
        />
      </svg>

      {isAtLimit ? (
        <span>Limit reached</span>
      ) : (
        <span>
          <span className={clsx('font-semibold tabular-nums', isWarning ? 'text-amber-700' : 'text-gray-700')}>
            {remaining}
          </span>
          {' '}
          <span className="text-gray-400">/ {FREE_LIMIT} pages left</span>
        </span>
      )}
    </button>
  )
}

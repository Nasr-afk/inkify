'use client'

import { useEffect, useRef }        from 'react'
import { useQuota }                  from '@/hooks/useQuota'
import { useRazorpay }               from '@/hooks/useRazorpay'
import { FREE_LIMIT, resetUsage }    from '@/lib/usage'
import { clsx }                      from 'clsx'

interface UpgradeModalProps {
  open:    boolean
  onClose: () => void
}

const PRO_FEATURES = [
  'Unlimited page exports',
  'All font styles & sizes',
  'High-res PNG + PDF download',
  'Priority support',
]

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const quota           = useQuota()
  const { phase, error, startUpgrade } = useRazorpay()
  const closeRef        = useRef<HTMLButtonElement>(null)

  const isProcessing = phase === 'creating-order' || phase === 'verifying'

  // Auto-focus close on open
  useEffect(() => {
    if (open) closeRef.current?.focus()
  }, [open])

  // Close on Escape (unless payment is in progress)
  useEffect(() => {
    if (!open) return
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) onClose()
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open, onClose, isProcessing])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Auto-close after successful payment
  useEffect(() => {
    if (phase === 'success') {
      const t = setTimeout(onClose, 1800)
      return () => clearTimeout(t)
    }
  }, [phase, onClose])

  if (!open) return null

  // ── Button state ──────────────────────────────────────────────────────────
  const btnLabel = (() => {
    switch (phase) {
      case 'creating-order': return 'Preparing…'
      case 'checkout':       return 'Complete in Razorpay…'
      case 'verifying':      return 'Verifying payment…'
      case 'success':        return '✓ Upgraded to Pro!'
      default:               return 'Upgrade to Pro — ₹199'
    }
  })()

  const btnColor = phase === 'success'
    ? 'bg-emerald-600 hover:bg-emerald-600'
    : 'bg-ink-600 hover:bg-ink-700'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
        style={{ animation: 'fadeIn 0.15s ease' }}
        onClick={() => !isProcessing && onClose()}
        aria-hidden
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-title"
        aria-describedby="upgrade-desc"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ animation: 'modalIn 0.18s ease' }}
      >
        <div
          className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gradient header */}
          <div className="bg-gradient-to-br from-ink-600 to-ink-800 px-6 pt-8 pb-10">
            <button suppressHydrationWarning
              ref={closeRef}
              onClick={() => !isProcessing && onClose()}
              disabled={isProcessing}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
                <path d="M4.22 4.22a.75.75 0 0 1 1.06 0L8 6.94l2.72-2.72a.75.75 0 1 1 1.06 1.06L9.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L8 9.06l-2.72 2.72a.75.75 0 0 1-1.06-1.06L6.94 8 4.22 5.28a.75.75 0 0 1 0-1.06Z" />
              </svg>
            </button>

            <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-2xl">
              {phase === 'success' ? '🎉' : '✦'}
            </div>

            <h2 id="upgrade-title" className="mt-3 text-xl font-semibold text-white">
              {phase === 'success'
                ? 'Welcome to Inkify Pro!'
                : 'Upgrade to Inkify Pro'}
            </h2>

            <p id="upgrade-desc" className="mt-1 text-sm text-white/70">
              {phase === 'success'
                ? 'Your account has been upgraded. Enjoy unlimited exports.'
                : quota.isAtLimit
                  ? <>You&apos;ve used all <strong className="text-white">{FREE_LIMIT}</strong> free pages. One-time payment, lifetime access.</>
                  : <>Unlock unlimited exports for a one-time payment of <strong className="text-white">₹199</strong>.</>
              }
            </p>
          </div>

          {/* Feature list */}
          <div className="-mt-5 mx-4 rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              Pro includes
            </p>
            <ul className="space-y-2">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-[10px] text-ink-700">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 px-4 pb-6 pt-4">
            {/* Error message */}
            {phase === 'error' && error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-600">
                {error}
              </p>
            )}

            <button suppressHydrationWarning
              onClick={startUpgrade}
              disabled={isProcessing || phase === 'success'}
              className={clsx(
                'flex w-full items-center justify-center gap-2',
                'rounded-xl py-3 text-sm font-semibold text-white',
                'transition-all active:scale-[0.98]',
                'focus:outline-none focus:ring-2 focus:ring-ink-500 focus:ring-offset-2',
                'disabled:cursor-wait disabled:opacity-75',
                btnColor
              )}
            >
              {isProcessing && (
                <span
                  className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white"
                  style={{ animation: 'spin 0.7s linear infinite' }}
                />
              )}
              {btnLabel}
            </button>

            {phase !== 'success' && (
              <button suppressHydrationWarning
                onClick={() => !isProcessing && onClose()}
                disabled={isProcessing}
                className="w-full rounded-xl py-2.5 text-sm text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40"
              >
                Maybe later
              </button>
            )}

            {/* Dev-only reset */}
            {process.env.NODE_ENV === 'development' && (
              <button suppressHydrationWarning
                onClick={() => { resetUsage(); onClose() }}
                className="w-full rounded py-1.5 text-[11px] text-gray-300 hover:text-gray-500"
              >
                [dev] Reset usage
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

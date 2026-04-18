'use client'

import Link                        from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { PenLine }                 from './icons'
import { useExport }               from '@/hooks/useExport'
import { QuotaCounter }            from '@/components/QuotaCounter'
import { UpgradeModal }            from '@/components/ui/UpgradeModal'
import { clsx }                    from 'clsx'

// ─── Export dropdown ──────────────────────────────────────────────────────────

const EXPORT_OPTIONS = [
  { format: 'pdf' as const, label: 'Export as PDF', sub: 'All pages · print-ready',     icon: '⬇' },
  { format: 'png' as const, label: 'Export as PNG', sub: 'Page 1 · high resolution',    icon: '🖼' },
]

interface ExportButtonProps {
  pageCount: number
}

function ExportButton({ pageCount }: ExportButtonProps) {
  const {
    progress, isExporting, isBlocked,
    showUpgradeModal, setShowUpgradeModal,
    run,
  } = useExport()

  const [open, setOpen]     = useState(false)
  const dropdownRef          = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  // Close dropdown on Escape
  useEffect(() => {
    if (!open) return
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open])

  const buttonLabel = (() => {
    switch (progress.phase) {
      case 'capturing':  return `Page ${progress.current}/${progress.total}…`
      case 'generating': return 'Building…'
      case 'done':       return '✓ Saved'
      case 'error':      return 'Failed'
      default:           return isBlocked ? '🔒 Export' : 'Export'
    }
  })()

  const buttonColor = (() => {
    if (isBlocked)               return 'bg-gray-400 hover:bg-gray-500 cursor-pointer'
    if (progress.phase === 'done')  return 'bg-emerald-600 hover:bg-emerald-700'
    if (progress.phase === 'error') return 'bg-red-600 hover:bg-red-700'
    return 'bg-ink-600 hover:bg-ink-700'
  })()

  function handleButtonClick() {
    if (isExporting) return
    if (isBlocked) { setShowUpgradeModal(true); return }
    setOpen((v) => !v)
  }

  return (
    <>
      <div ref={dropdownRef} className="relative">
        <button
          onClick={handleButtonClick}
          disabled={isExporting}
          aria-haspopup="menu"
          aria-expanded={open}
          className={clsx(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white',
            'transition-colors disabled:cursor-wait disabled:opacity-70',
            buttonColor
          )}
        >
          {isExporting && (
            <span
              className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white"
              style={{ animation: 'spin 0.7s linear infinite' }}
            />
          )}
          {buttonLabel}
          {!isExporting && !isBlocked && progress.phase === 'idle' && (
            <svg className="h-3 w-3 opacity-70" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 8L2 4h8z" />
            </svg>
          )}
        </button>

        {/* Dropdown menu */}
        {open && !isExporting && !isBlocked && (
          <div
            role="menu"
            className={clsx(
              'absolute right-0 top-full z-50 mt-1.5 w-56',
              'rounded-xl border border-gray-200 bg-white py-1 shadow-xl shadow-black/10',
              'animate-fade-in'
            )}
          >
            {EXPORT_OPTIONS.map(({ format, label, sub, icon }) => (
              <button
                key={format}
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  run(format, pageCount)
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50"
              >
                <span className="text-base">{icon}</span>
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-gray-800">{label}</span>
                  <span className="text-[11px] text-gray-400">{sub}</span>
                </span>
              </button>
            ))}

            {progress.phase === 'error' && (
              <div className="border-t border-gray-100 px-4 py-2 text-[11px] text-red-500">
                {progress.message}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upgrade modal — rendered outside the dropdown div for stacking context */}
      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

interface NavbarProps {
  pageCount?: number
}

export function Navbar({ pageCount = 1 }: NavbarProps) {
  const [showUpgrade, setShowUpgrade] = useState(false)

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div className="flex h-full items-center justify-between px-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 select-none">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-600">
              <PenLine className="h-4 w-4 text-white" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-gray-900">
              Inkify
            </span>
          </Link>

          {/* Center nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {['File', 'Edit', 'View', 'Insert'].map((item) => (
              <button
                key={item}
                className="rounded-md px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                {item}
              </button>
            ))}
          </nav>

          {/* Right: quota + share + export */}
          <div className="flex items-center gap-2">
            <QuotaCounter onLimitClick={() => setShowUpgrade(true)} />

            <button className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50">
              Share
            </button>

            <ExportButton pageCount={pageCount} />
          </div>
        </div>
      </header>

      {/* Quota limit modal triggered from QuotaCounter */}
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
      />
    </>
  )
}

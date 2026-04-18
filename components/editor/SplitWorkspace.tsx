'use client'

import { useState }      from 'react'
import { TextEditor }    from './TextEditor'
import { PreviewPane }   from './PreviewPane'
import { ControlsPanel } from './ControlsPanel'
import { Navbar }        from '@/components/Navbar'
import { clsx }          from 'clsx'

type MobileTab = 'editor' | 'preview'

export function SplitWorkspace() {
  const [pageCount, setPageCount] = useState(1)
  const [mobileTab, setMobileTab] = useState<MobileTab>('editor')

  return (
    <>
      <Navbar pageCount={pageCount} />

      <div className="flex h-[100dvh] flex-col overflow-hidden">

        {/* ── Mobile tab bar (hidden on lg+) ──────────────────────────── */}
        <div className="flex shrink-0 border-b border-gray-200 bg-white pt-14 lg:hidden">
          {(['editor', 'preview'] as MobileTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={clsx(
                'flex-1 py-2.5 text-sm font-medium capitalize transition-colors',
                mobileTab === tab
                  ? 'border-b-2 border-ink-600 text-ink-700'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Main area ───────────────────────────────────────────────── */}
        <div className="flex min-h-0 flex-1 overflow-hidden lg:pt-14">

          {/* Left: editor — full-width on mobile when tab active */}
          <section
            className={clsx(
              'flex min-h-0 flex-col bg-white',
              // Mobile: fill screen when active, hidden when preview tab
              mobileTab === 'editor' ? 'flex-1' : 'hidden',
              // Desktop: always shown, half width, border divider
              'lg:flex lg:flex-1 lg:border-r lg:border-gray-200'
            )}
          >
            <TextEditor />
          </section>

          {/* Right: preview — full-width on mobile when tab active */}
          <section
            className={clsx(
              'flex min-h-0 flex-col bg-white',
              mobileTab === 'preview' ? 'flex-1' : 'hidden',
              'lg:flex lg:flex-1'
            )}
          >
            <PreviewPane onPageCountChange={setPageCount} />
          </section>
        </div>

        {/* ── Controls ────────────────────────────────────────────────── */}
        <div className="shrink-0 overflow-x-auto border-t border-gray-200 bg-white shadow-[0_-1px_0_0_#f3f4f6] scrollbar-thin">
          <ControlsPanel />
        </div>
      </div>
    </>
  )
}

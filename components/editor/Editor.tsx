'use client'

import { useState }    from 'react'
import { PreviewPane } from './PreviewPane'
import { Controls }    from './Controls'
import { Navbar }      from '@/components/Navbar'

export function Editor() {
  const [pageCount, setPageCount] = useState(1)

  return (
    <>
      <Navbar pageCount={pageCount} />

      <div className="flex h-[100dvh] flex-col overflow-hidden">

        {/* ── Workspace ───────────────────────────────────────────────── */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-14">
          <PreviewPane onPageCountChange={setPageCount} />
        </div>

        {/* ── Controls ────────────────────────────────────────────────── */}
        <div className="shrink-0 overflow-x-auto border-t border-gray-200 bg-white shadow-[0_-1px_0_0_#f3f4f6] scrollbar-thin">
          <Controls />
        </div>
      </div>
    </>
  )
}

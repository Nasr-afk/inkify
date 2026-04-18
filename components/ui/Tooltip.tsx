'use client'

import { clsx } from 'clsx'
import { useState, useRef } from 'react'

interface TooltipProps {
  content: string
  children: React.ReactElement
  side?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const sideClasses: Record<string, string> = {
    top:    '-top-8 left-1/2 -translate-x-1/2',
    bottom: '-bottom-8 left-1/2 -translate-x-1/2',
    left:   'top-1/2 -left-2 -translate-y-1/2 -translate-x-full',
    right:  'top-1/2 -right-2 -translate-y-1/2 translate-x-full',
  }

  return (
    <div
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          className={clsx(
            'pointer-events-none absolute z-50 whitespace-nowrap rounded bg-gray-900 px-2 py-1',
            'text-[11px] font-medium text-white shadow animate-fade-in',
            sideClasses[side]
          )}
        >
          {content}
        </span>
      )}
    </div>
  )
}

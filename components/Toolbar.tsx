'use client'

import { useCanvas } from '@/hooks/useCanvas'
import { useKeyboard } from '@/hooks/useKeyboard'
import { Tooltip } from '@/components/ui'
import { clsx } from 'clsx'

const tools = [
  { type: 'rect'   as const, label: 'Rectangle', key: 'r', icon: '▭' },
  { type: 'circle' as const, label: 'Circle',    key: 'o', icon: '○' },
  { type: 'text'   as const, label: 'Text',      key: 't', icon: 'T' },
  { type: 'line'   as const, label: 'Line',      key: 'l', icon: '╱' },
]

export function Toolbar() {
  const { addShape, deleteSelected } = useCanvas()

  // Keyboard shortcuts
  useKeyboard({
    r:        () => addShape('rect'),
    o:        () => addShape('circle'),
    t:        () => addShape('text'),
    l:        () => addShape('line'),
    Delete:   () => deleteSelected(),
    Backspace: () => deleteSelected(),
  })

  return (
    <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2 py-1.5 shadow-sm">
      {tools.map(({ type, label, key, icon }) => (
        <Tooltip key={type} content={`${label} (${key})`} side="bottom">
          <button
            onClick={() => addShape(type)}
            className={clsx(
              'flex h-8 w-8 items-center justify-center rounded-lg text-sm',
              'text-gray-600 transition-colors hover:bg-ink-50 hover:text-ink-700'
            )}
          >
            {icon}
          </button>
        </Tooltip>
      ))}

      <div className="mx-1 h-5 w-px bg-gray-200" />

      <Tooltip content="Delete selected (⌫)" side="bottom">
        <button
          onClick={deleteSelected}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
        >
          ✕
        </button>
      </Tooltip>
    </div>
  )
}

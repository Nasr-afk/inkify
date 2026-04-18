'use client'

import { clsx } from 'clsx'
import { useState } from 'react'
import { useCanvas } from '@/hooks/useCanvas'
import { LayoutGrid, Layers, Settings } from './icons'
import type { CanvasElement } from '@/lib/store'

type Panel = 'elements' | 'layers' | 'settings'

const panels: { id: Panel; icon: React.FC<React.SVGProps<SVGSVGElement>>; label: string }[] = [
  { id: 'elements', icon: LayoutGrid, label: 'Elements' },
  { id: 'layers',   icon: Layers,     label: 'Layers'   },
  { id: 'settings', icon: Settings,   label: 'Settings' },
]

const shapes: { type: CanvasElement['type']; label: string; key: string }[] = [
  { type: 'rect',   label: 'Rectangle', key: 'R' },
  { type: 'circle', label: 'Circle',    key: 'O' },
  { type: 'text',   label: 'Text',      key: 'T' },
  { type: 'line',   label: 'Line',      key: 'L' },
  { type: 'image',  label: 'Image',     key: 'I' },
]

export function Sidebar() {
  const [active, setActive] = useState<Panel>('elements')
  const { elements, selectedId, selectElement, addShape, deleteSelected } = useCanvas()

  return (
    <aside className="flex h-full w-60 flex-col border-r border-gray-200 bg-white">
      {/* Tab strip */}
      <div className="flex border-b border-gray-200">
        {panels.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            title={label}
            className={clsx(
              'flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors',
              active === id
                ? 'border-b-2 border-ink-600 text-ink-600'
                : 'text-gray-400 hover:text-gray-700'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Panel body */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        {active === 'elements' && (
          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Shapes
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {shapes.map(({ type, label, key }) => (
                <button
                  key={type}
                  onClick={() => addShape(type)}
                  className="flex flex-col items-center gap-1 rounded-lg border border-gray-100 bg-gray-50 py-3 text-xs text-gray-600 transition-all hover:border-ink-300 hover:bg-ink-50 hover:text-ink-700"
                >
                  <span className="text-lg leading-none">{key}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {active === 'layers' && (
          <div className="space-y-1">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Layers ({elements.length})
            </p>
            {elements.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-gray-200">
                <p className="text-xs text-gray-400">No layers yet</p>
              </div>
            ) : (
              [...elements].reverse().map((el) => (
                <button
                  key={el.id}
                  onClick={() => selectElement(el.id)}
                  className={clsx(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                    selectedId === el.id
                      ? 'bg-ink-50 text-ink-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <span className="font-mono text-[10px] uppercase text-gray-400">{el.type}</span>
                  <span className="truncate">{el.label ?? `${el.type}-${el.id}`}</span>
                  {selectedId === el.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSelected() }}
                      className="ml-auto text-gray-400 hover:text-red-500"
                    >
                      ✕
                    </button>
                  )}
                </button>
              ))
            )}
          </div>
        )}

        {active === 'settings' && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Canvas size
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <p className="mb-1 text-[10px] text-gray-400">Width</p>
                  <input
                    type="number"
                    defaultValue={960}
                    className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500"
                  />
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-[10px] text-gray-400">Height</p>
                  <input
                    type="number"
                    defaultValue={600}
                    className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink-500"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Background
              </label>
              <input
                type="color"
                defaultValue="#ffffff"
                className="h-8 w-full cursor-pointer rounded-md border border-gray-200 px-1 py-0.5"
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

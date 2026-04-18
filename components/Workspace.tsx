'use client'

import { useCanvas } from '@/hooks/useCanvas'
import { formatZoom } from '@/lib/utils'
import { clsx } from 'clsx'

export function Workspace() {
  const { elements, selectedId, zoom, selectElement, zoomIn, zoomOut, zoomReset } = useCanvas()

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-gray-100 workspace-grid">
      {/* Canvas */}
      <div
        className="relative shadow-2xl"
        style={{
          width:     960 * zoom,
          height:    600 * zoom,
          transform: `scale(1)`, // zoom applied via width/height
          transition: 'width 0.15s ease, height 0.15s ease',
        }}
        onClick={() => selectElement(null)}
      >
        {/* Ruler label */}
        <div className="absolute -top-6 left-0 select-none text-[11px] text-gray-400">
          {Math.round(960 * zoom)} × {Math.round(600 * zoom)}
        </div>

        {/* White canvas surface */}
        <div className="relative h-full w-full overflow-hidden rounded-sm bg-white">
          {elements.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-300">
              <span className="text-4xl">✦</span>
              <p className="text-sm">Add an element from the sidebar or toolbar</p>
            </div>
          )}

          {elements.map((el) => (
            <div
              key={el.id}
              onClick={(e) => { e.stopPropagation(); selectElement(el.id) }}
              style={{ left: el.x, top: el.y, width: el.width, height: el.height }}
              className={clsx(
                'absolute cursor-pointer',
                selectedId === el.id && 'ring-2 ring-ink-500 ring-offset-1',
                el.type === 'rect'   && 'rounded-sm border-2 border-ink-400 bg-ink-100/40',
                el.type === 'circle' && 'rounded-full border-2 border-ink-400 bg-ink-100/40',
                el.type === 'text'   && 'flex items-center border border-dashed border-gray-300 px-2 text-sm text-gray-700',
                el.type === 'line'   && 'h-0.5 bg-ink-400',
              )}
            >
              {el.type === 'text' && (el.label ?? 'Text')}
            </div>
          ))}
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 shadow-sm">
        <button
          onClick={zoomOut}
          className="rounded px-1.5 py-0.5 text-sm text-gray-500 hover:bg-gray-100"
        >
          −
        </button>
        <button
          onClick={zoomReset}
          className="min-w-[3.5rem] rounded px-1.5 py-0.5 text-center text-xs font-medium text-gray-700 hover:bg-gray-100"
        >
          {formatZoom(zoom)}
        </button>
        <button
          onClick={zoomIn}
          className="rounded px-1.5 py-0.5 text-sm text-gray-500 hover:bg-gray-100"
        >
          +
        </button>
      </div>
    </main>
  )
}

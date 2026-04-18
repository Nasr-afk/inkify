'use client'

import { useMemo, useRef, useState } from 'react'
import { useEditor }                  from '@/hooks/useEditor'
import { useDebounce }                from '@/hooks/useDebounce'
import { useContainerWidth }          from '@/hooks/useContainerWidth'
import { paginateText }               from '@/lib/paginator'
import { Page, PAGE_WIDTH, PAGE_HEIGHT } from './Page'
import { prewarmEngine }              from '@/lib/handwritingEngine'
import type { HandwritingOptions }    from '@/lib/handwritingEngine'
import type { PageSlice }             from '@/lib/paginator'
import { clsx }                       from 'clsx'

prewarmEngine(500)

// ─── Constants ────────────────────────────────────────────────────────────────

const CONTAINER_PADDING = 48   // px, total horizontal padding inside scroll area
const ZOOM_LEVELS = [0.5, 0.75, 1] as const
type ZoomLevel = typeof ZOOM_LEVELS[number]
const ZOOM_LABELS: Record<ZoomLevel, string> = { 0.5: '50%', 0.75: '75%', 1: '100%' }

// ─── Pending dots ─────────────────────────────────────────────────────────────

function PendingDots() {
  return (
    <span className="flex items-center gap-[3px]" aria-label="Updating…">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1 w-1 rounded-full bg-ink-400"
          style={{ animation: 'inkPulse 1s ease-in-out infinite', animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PreviewPaneProps {
  onPageCountChange?: (count: number) => void
}

export function PreviewPane({ onPageCountChange }: PreviewPaneProps) {
  const { text, fontStyle, fontSize, fontFamily, inkColor, messiness } = useEditor()
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel | 'fit'>('fit')

  const { debounced: debouncedText, isPending } = useDebounce(text, 300)
  const stalePagesRef = useRef<PageSlice[]>([])

  // ── Measure the scroll container to auto-scale pages ─────────────────────
  const [scrollRef, containerWidth] = useContainerWidth()

  // Compute the effective scale:
  // 'fit' = shrink-to-fit (never upscale beyond 1)
  // fixed levels = use as-is
  const scale = useMemo(() => {
    if (!containerWidth) return 1
    const maxFit = Math.min(1, (containerWidth - CONTAINER_PADDING) / PAGE_WIDTH)
    if (zoomLevel === 'fit') return maxFit
    return zoomLevel
  }, [containerWidth, zoomLevel])

  // ── Paginate ──────────────────────────────────────────────────────────────
  const freshPages = useMemo<PageSlice[]>(
    () => paginateText(debouncedText, { fontStyle, fontSize, lineHeight: 1.9 }),
    [debouncedText, fontStyle, fontSize]
  )

  if (freshPages.length > 0) stalePagesRef.current = freshPages
  const pages = freshPages.length > 0 ? freshPages : stalePagesRef.current

  if (freshPages.length > 0) onPageCountChange?.(freshPages.length)

  // ── Stable handwriting options ────────────────────────────────────────────
  const hwOptions = useMemo<HandwritingOptions>(
    () => ({ messiness, inkColor, fontFamily, fontSize: `${fontSize}px`, lineHeight: 1.9 }),
    [messiness, inkColor, fontFamily, fontSize]
  )

  const isEmpty = text.trim().length === 0

  // Scaled page height — used to size the wrapper so pages stack correctly
  const scaledPageHeight = PAGE_HEIGHT * scale

  return (
    <div className="flex h-full flex-col">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className={clsx(
            'h-2 w-2 rounded-full transition-colors duration-300',
            isPending ? 'bg-amber-400' : 'bg-emerald-400'
          )} />
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Preview
          </span>
        </div>

        <div className="flex h-5 items-center gap-3">
          {/* Zoom controls */}
          <div className="flex items-center rounded-md border border-gray-200 text-[11px]">
            <button
              onClick={() => setZoomLevel('fit')}
              className={clsx(
                'rounded-l-md px-2 py-0.5 transition-colors',
                zoomLevel === 'fit'
                  ? 'bg-ink-50 text-ink-600'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
              )}
            >
              Fit
            </button>
            {ZOOM_LEVELS.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setZoomLevel(lvl)}
                className={clsx(
                  'border-l border-gray-200 px-2 py-0.5 transition-colors last:rounded-r-md',
                  zoomLevel === lvl
                    ? 'bg-ink-50 text-ink-600'
                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                )}
              >
                {ZOOM_LABELS[lvl]}
              </button>
            ))}
          </div>

          {/* Page count */}
          {!isEmpty && (
            <span className="text-[11px] text-gray-300">
              {pages.length}p
            </span>
          )}

          {isPending ? <PendingDots /> : (
            <span className="rounded-full border border-gray-100 px-2 py-0.5 text-[11px] text-gray-300">
              live
            </span>
          )}
        </div>
      </div>

      {/* ── Page stack ──────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        id="inkify-preview"
        className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin"
        style={{
          background:      '#e8eaf0',
          backgroundImage: 'radial-gradient(circle at 50% 0%, #ede9fe 0%, #e8eaf0 60%)',
        }}
      >
        <div
          className="flex flex-col items-center"
          style={{ padding: `32px ${CONTAINER_PADDING / 2}px`, gap: 24 * scale }}
        >
          {pages.map((page) => (
            // Outer wrapper: sized to scaled dimensions so siblings stack correctly
            <div
              key={page.pageIndex}
              style={{
                width:  PAGE_WIDTH  * scale,
                height: scaledPageHeight,
                flexShrink: 0,
                position: 'relative',
              }}
            >
              {/* Inner: full A4 size, scaled via transform */}
              <div
                style={{
                  position:       'absolute',
                  top:            0,
                  left:           0,
                  width:          PAGE_WIDTH,
                  height:         PAGE_HEIGHT,
                  transform:      `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
              >
                <Page
                  text={page.text}
                  charOffset={page.charOffset}
                  pageIndex={page.pageIndex}
                  options={hwOptions}
                  isPending={isPending}
                />
              </div>
            </div>
          ))}
          <div style={{ height: 16 }} />
        </div>
      </div>
    </div>
  )
}

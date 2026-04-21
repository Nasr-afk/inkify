'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useEditor }                  from '@/hooks/useEditor'
import { useDebounce }                from '@/hooks/useDebounce'
import { useContainerWidth }          from '@/hooks/useContainerWidth'
import { paginateText }               from '@/lib/paginator'
import { Page }                        from './Page'
import { prewarmEngine }              from '@/lib/handwritingEngine'
import { getPaper }                   from '@/lib/paper'
import type { HandwritingOptions }    from '@/lib/handwritingEngine'
import type { PageSlice }             from '@/lib/paginator'
import { clsx }                       from 'clsx'

prewarmEngine(500)

// ─── Constants ────────────────────────────────────────────────────────────────

const CONTAINER_PADDING = 48   // px, total horizontal padding inside scroll area
const ZOOM_LEVELS = [0.5, 0.75, 1] as const
type ZoomLevel = typeof ZOOM_LEVELS[number]
const ZOOM_LABELS: Record<ZoomLevel, string> = { 0.5: '50%', 0.75: '75%', 1: '100%' }

// ─── Component ────────────────────────────────────────────────────────────────

interface PreviewPaneProps {
  onPageCountChange?: (count: number) => void
}

export function PreviewPane({ onPageCountChange }: PreviewPaneProps) {
  const {
    text, setText, fontStyle, fontSize, fontFamily, inkColor, messiness, inkBlur, pageStyle,
    textOffsetX, textOffsetY, setTextOffsetX, setTextOffsetY, paperSize,
    highlights, addHighlight, removeHighlight,
  } = useEditor()
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel | 'fit'>('fit')

  const paper = useMemo(() => getPaper(paperSize), [paperSize])

  const { debounced: debouncedText, isPending } = useDebounce(text, 300)
  const stalePagesRef = useRef<PageSlice[]>([])

  // ── Measure the scroll container to auto-scale pages ─────────────────────
  const [scrollRef, containerWidth] = useContainerWidth()

  // Compute the effective scale:
  // 'fit' = shrink-to-fit (never upscale beyond 1)
  // fixed levels = use as-is
  const scale = useMemo(() => {
    if (!containerWidth) return 1
    const maxFit = Math.min(1, (containerWidth - CONTAINER_PADDING) / paper.width)
    if (zoomLevel === 'fit') return maxFit
    return zoomLevel
  }, [containerWidth, zoomLevel])

  // ── Paginate ──────────────────────────────────────────────────────────────
  const freshPages = useMemo<PageSlice[]>(
    () => paginateText(debouncedText, {
      fontStyle, fontSize, lineHeight: 1.9,
      pageWidth:    paper.width,
      pageHeight:   paper.height,
      marginTop:    paper.marginTop,
      marginBottom: paper.marginBottom,
      marginLeft:   paper.marginLeft,
      marginRight:  paper.marginRight,
    }),
    [debouncedText, fontStyle, fontSize, paper]
  )

  if (freshPages.length > 0) stalePagesRef.current = freshPages
  const pages = freshPages.length > 0 ? freshPages : stalePagesRef.current

  useEffect(() => {
    if (freshPages.length > 0) onPageCountChange?.(freshPages.length)
  }, [freshPages.length, onPageCountChange])

  // ── Stable handwriting options ────────────────────────────────────────────
  const hwOptions = useMemo<HandwritingOptions>(
    () => ({ messiness, inkColor, fontFamily, fontSize: `${fontSize}px`, lineHeight: 1.9, paperColor: '#ffffff', blur: inkBlur }),
    [messiness, inkColor, fontFamily, fontSize, inkBlur]
  )

  // Scaled page height — used to size the wrapper so pages stack correctly
  const scaledPageHeight = paper.height * scale

  return (
    <div className="relative flex h-full flex-col">

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
            <div
              key={page.pageIndex}
              style={{
                width:      paper.width * scale,
                height:     scaledPageHeight,
                flexShrink: 0,
                position:   'relative',
              }}
            >
              <div
                style={{
                  position:        'absolute',
                  top:             0,
                  left:            0,
                  width:           paper.width,
                  height:          paper.height,
                  transform:       `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
              >
                <Page
                  text={page.text}
                  charOffset={page.charOffset}
                  pageIndex={page.pageIndex}
                  options={hwOptions}
                  pageStyle={pageStyle}
                  isPending={isPending}
                  editable={page.pageIndex === 0}
                  rawText={page.pageIndex === 0 ? text : undefined}
                  onTextChange={page.pageIndex === 0 ? setText : undefined}
                  highlights={highlights}
                  pageStringOffset={page.charOffset}
                  onAddHighlight={(start, end, color) => addHighlight({ start, end, color })}
                  onRemoveHighlight={removeHighlight}
                  paperDimensions={paper}
                  textOffsetX={textOffsetX}
                  textOffsetY={textOffsetY}
                  onShift={(dx, dy) => {
                    setTextOffsetX(textOffsetX + dx)
                    setTextOffsetY(textOffsetY + dy)
                  }}
                />
              </div>
            </div>
          ))}
          <div style={{ height: 16 }} />
        </div>
      </div>

      {/* ── Floating zoom controls ───────────────────────────────────────── */}
      <div className="pointer-events-none absolute bottom-4 right-4 z-10">
        <div className="pointer-events-auto flex items-center rounded-md border border-gray-200/70 bg-white/80 text-[11px] shadow-sm backdrop-blur-sm">
          <button suppressHydrationWarning
            onClick={() => setZoomLevel('fit')}
            className={clsx(
              'rounded-l-md px-2.5 py-1 transition-colors',
              zoomLevel === 'fit'
                ? 'bg-ink-50 text-ink-600'
                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
            )}
          >
            Fit
          </button>
          {ZOOM_LEVELS.map((lvl) => (
            <button suppressHydrationWarning
              key={lvl}
              onClick={() => setZoomLevel(lvl)}
              className={clsx(
                'border-l border-gray-200 px-2.5 py-1 transition-colors last:rounded-r-md',
                zoomLevel === lvl
                  ? 'bg-ink-50 text-ink-600'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
              )}
            >
              {ZOOM_LABELS[lvl]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

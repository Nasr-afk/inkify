'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Controls } from './Controls'
import { Navbar } from '@/components/Navbar'
import { useEditor } from '@/hooks/useEditor'
import { useDebounce } from '@/hooks/useDebounce'
import { useContainerWidth } from '@/hooks/useContainerWidth'
import { paginateText } from '@/lib/paginator'
import { prewarmEngine } from '@/lib/handwritingEngine'
import type { HandwritingOptions } from '@/lib/handwritingEngine'
import { getPaper } from '@/lib/paperEngine'
import type { PageSlice } from '@/lib/paginator'
import { getFontDef, registerLocalFonts } from '@/lib/fonts'
import { clsx } from 'clsx'
import { Paper } from './Paper'
import { TextLayer } from './TextLayer'
import { getBackgroundDef } from '@/lib/backgrounds'

prewarmEngine(500)

const CONTAINER_PADDING = 48
const ZOOM_LEVELS = [0.5, 0.75, 1] as const
type ZoomLevel = typeof ZOOM_LEVELS[number]
const ZOOM_LABELS: Record<ZoomLevel, string> = { 0.5: '50%', 0.75: '75%', 1: '100%' }

function parseHexColor(hex: string): [number, number, number] | null {
  const s = hex.trim().replace(/^#/, '')
  if (s.length === 3) return [parseInt(s[0] + s[0], 16), parseInt(s[1] + s[1], 16), parseInt(s[2] + s[2], 16)]
  if (s.length === 6) return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]
  return null
}

function toLinear(c: number) {
  const v = c / 255
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string) {
  const rgb = parseHexColor(hex)
  if (!rgb) return 1
  return 0.2126 * toLinear(rgb[0]) + 0.7152 * toLinear(rgb[1]) + 0.0722 * toLinear(rgb[2])
}

function deterministicJitter(pageIndex: number, salt: number): number {
  const x = Math.sin((pageIndex + 1) * 12.9898 + salt * 78.233) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
}

export function Editor() {
  const {
    text, setText, fontStyle, fontSize, fontFamily, inkColor, messiness, inkBlur, pageStyle, paperSize, customBackground, backgroundPreset, customBackgroundImage,
    textOffsetX, textOffsetY, shiftTextOffset,
    highlights, addHighlight, removeHighlight, blurRanges, addBlurRange, removeBlurRange, printMode,
  } = useEditor()
  const [pageCount, setPageCount] = useState(1)
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel | 'fit'>('fit')
  const [previewMode, setPreviewMode] = useState(false)
  const paper = useMemo(() => getPaper(paperSize), [paperSize])
  const [scrollRef, containerWidth] = useContainerWidth()
  const { debounced: debouncedText, isPending } = useDebounce(text, 300)
  const stalePagesRef = useRef<PageSlice[]>([])

  const scale = useMemo(() => {
    if (!containerWidth) return 1
    const maxFit = Math.min(1, (containerWidth - CONTAINER_PADDING) / paper.width)
    if (zoomLevel === 'fit') return maxFit
    return zoomLevel
  }, [containerWidth, zoomLevel, paper.width])

  useEffect(() => {
    void registerLocalFonts()
  }, [])

  const fontDef = useMemo(() => getFontDef(fontStyle), [fontStyle])
  const computedFontSize = fontSize * (fontDef.sizeMultiplier ?? 1)
  const computedLineHeight = 1.9 * (fontDef.spacingMultiplier ?? 1)

  const pages = useMemo<PageSlice[]>(
    () => paginateText(debouncedText, {
      fontStyle,
      fontSize: computedFontSize,
      lineHeight: computedLineHeight,
      pageWidth: paper.width,
      pageHeight: paper.height,
      marginTop: paper.marginTop,
      marginBottom: paper.marginBottom,
      marginLeft: paper.marginLeft,
      marginRight: paper.marginRight,
    }),
    [debouncedText, fontStyle, computedFontSize, computedLineHeight, paper]
  )
  if (pages.length > 0) stalePagesRef.current = pages
  const resolvedPages = pages.length > 0 ? pages : stalePagesRef.current

  useEffect(() => {
    if (resolvedPages.length > 0) setPageCount(resolvedPages.length)
  }, [resolvedPages.length])

  const bgDef = useMemo(() => getBackgroundDef(backgroundPreset), [backgroundPreset])
  const effectivePaperBg = pageStyle === 'custom' ? customBackground : '#ffffff'
  const autoInkColor = useMemo(() => {
    const bgLum = backgroundPreset === 'custom-image' ? bgDef.estimatedBrightness : luminance(effectivePaperBg)
    const inkLum = luminance(inkColor)
    const contrast = (Math.max(bgLum, inkLum) + 0.05) / (Math.min(bgLum, inkLum) + 0.05)
    if (contrast >= 4.5) return inkColor
    return bgLum < 0.4 ? '#f8fafc' : '#1a1a2e'
  }, [backgroundPreset, bgDef.estimatedBrightness, effectivePaperBg, inkColor])

  const hwOptions = useMemo<HandwritingOptions>(
    () => ({ messiness, inkColor: autoInkColor, fontFamily, fontSize: `${computedFontSize}px`, lineHeight: computedLineHeight, paperColor: effectivePaperBg, blur: inkBlur, printMode }),
    [messiness, autoInkColor, fontFamily, computedFontSize, computedLineHeight, effectivePaperBg, inkBlur, printMode]
  )
  const scaledPageHeight = paper.height * scale

  return (
    <>
      <Navbar pageCount={pageCount} />

      <div className="flex h-[100dvh] flex-col overflow-hidden">

        {/* ── Workspace ───────────────────────────────────────────────── */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-14">
          <div className="relative flex h-full flex-col">
            <div
              ref={scrollRef}
              id="inkify-preview"
              className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin"
              style={{ background: '#e8eaf0', backgroundImage: 'radial-gradient(circle at 50% 0%, #ede9fe 0%, #e8eaf0 60%)' }}
            >
              <div className="flex flex-col items-center" style={{ padding: `32px ${CONTAINER_PADDING / 2}px`, gap: 24 * scale }}>
                {resolvedPages.map((page) => (
                  <div key={page.pageIndex} style={{ width: paper.width * scale, height: scaledPageHeight, flexShrink: 0, position: 'relative' }}>
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: paper.width,
                        height: paper.height,
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                      }}
                    >
                      {(() => {
                        const marginOffsetX = deterministicJitter(page.pageIndex, 1) * 2.2
                        const marginOffsetY = deterministicJitter(page.pageIndex, 2) * 2.0
                        const alignShiftX   = deterministicJitter(page.pageIndex, 4) * 2.5
                        const pageTiltDeg   = deterministicJitter(page.pageIndex, 5) * 0.18
                        return (
                      <Paper
                        pageIndex={page.pageIndex}
                        pageStyle={pageStyle}
                        backgroundColor={effectivePaperBg}
                        backgroundPreset={backgroundPreset}
                        backgroundImageUrl={customBackgroundImage}
                        printMode={printMode}
                        isPending={isPending}
                        paperDimensions={paper}
                      >
                        <TextLayer
                          text={page.text}
                          charOffset={page.charOffset}
                          pageStringOffset={page.charOffset}
                          options={hwOptions}
                          highlights={highlights}
                          blurRanges={blurRanges}
                          isFirstPage={page.pageIndex === 0}
                          editable={page.pageIndex === 0}
                          rawText={page.pageIndex === 0 ? text : undefined}
                          onTextChange={page.pageIndex === 0 ? setText : undefined}
                          inkColor={autoInkColor}
                          fontSize={`${computedFontSize}px`}
                          effectiveBlur={Math.min(2, inkBlur + (messiness / 100) * 0.3)}
                          noiseId={`inkify-noise-${page.pageIndex}`}
                          textOffsetX={textOffsetX}
                          textOffsetY={textOffsetY}
                          renderOffsetX={alignShiftX + marginOffsetX}
                          renderOffsetY={marginOffsetY}
                          renderTiltDeg={pageTiltDeg}
                          previewMode={previewMode}
                          printMode={printMode}
                          onShift={(dx, dy) => {
                            shiftTextOffset(dx, dy)
                          }}
                          onAddHighlight={(start, end, color) => addHighlight({ start, end, color })}
                          onRemoveHighlight={removeHighlight}
                          onAddBlur={(start, end, amount) => addBlurRange({ start, end, amount })}
                          onRemoveBlur={removeBlurRange}
                        />
                      </Paper>
                        )
                      })()}
                    </div>
                  </div>
                ))}
                <div style={{ height: 16 }} />
              </div>
            </div>

            <div className="pointer-events-none absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2">
              {/* ── Preview mode toggle ─────────────────────────────────── */}
              <div className="pointer-events-auto">
                <button
                  suppressHydrationWarning
                  onClick={() => setPreviewMode((p) => !p)}
                  className={clsx(
                    'rounded-md border px-3 py-1 text-[11px] font-medium shadow-sm backdrop-blur-sm transition-colors',
                    previewMode
                      ? 'border-ink-400/60 bg-ink-50/90 text-ink-600'
                      : 'border-gray-200/70 bg-white/80 text-gray-500 hover:bg-gray-50/90 hover:text-gray-700'
                  )}
                >
                  {previewMode ? 'Editing' : 'Preview'}
                </button>
              </div>

              {/* ── Zoom controls ───────────────────────────────────────── */}
              <div className="pointer-events-auto flex items-center rounded-md border border-gray-200/70 bg-white/80 text-[11px] shadow-sm backdrop-blur-sm">
                <button
                  suppressHydrationWarning
                  onClick={() => setZoomLevel('fit')}
                  className={clsx('rounded-l-md px-2.5 py-1 transition-colors', zoomLevel === 'fit' ? 'bg-ink-50 text-ink-600' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700')}
                >
                  Fit
                </button>
                {ZOOM_LEVELS.map((lvl) => (
                  <button
                    suppressHydrationWarning
                    key={lvl}
                    onClick={() => setZoomLevel(lvl)}
                    className={clsx('border-l border-gray-200 px-2.5 py-1 transition-colors last:rounded-r-md', zoomLevel === lvl ? 'bg-ink-50 text-ink-600' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700')}
                  >
                    {ZOOM_LABELS[lvl]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Controls ────────────────────────────────────────────────── */}
        <div className="shrink-0 overflow-x-auto border-t border-gray-200 bg-white shadow-[0_-1px_0_0_#f3f4f6] scrollbar-thin">
          <Controls />
        </div>
      </div>
    </>
  )
}

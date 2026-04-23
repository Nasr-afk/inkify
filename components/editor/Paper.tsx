'use client'

import { useMemo, useRef, useEffect } from 'react'
import type { ReactNode }              from 'react'
import { renderHandwriting }           from '@/lib/handwritingEngine'
import type { HandwritingOptions }     from '@/lib/handwritingEngine'
import type { PageStyle, Highlight }   from '@/lib/store'
import type { PaperDimensions }        from '@/lib/paperEngine'
import { HighlightToolbar }            from './HighlightToolbar'
import { TextLayer }                   from './TextLayer'
import { useSelection }                from '@/hooks/useSelection'

// ─── A4 fallback constants (px at 96 dpi) ─────────────────────────────────────
export const PAGE_WIDTH    = 794
export const PAGE_HEIGHT   = 1123
export const MARGIN_TOP    = 72
export const MARGIN_BOTTOM = 48
export const MARGIN_LEFT   = 80
export const MARGIN_RIGHT  = 48
export const RED_LINE_X    = 60

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaperProps {
  text:               string
  charOffset:         number
  pageIndex:          number
  options:            HandwritingOptions
  pageStyle?:         PageStyle
  isPending?:         boolean
  editable?:          boolean
  rawText?:           string
  onTextChange?:      (text: string) => void
  highlights?:        Highlight[]
  pageStringOffset?:  number
  onAddHighlight?:    (start: number, end: number, color: string) => void
  onRemoveHighlight?: (id: string) => void
  textOffsetX?:       number
  textOffsetY?:       number
  onShift?:           (dx: number, dy: number) => void
  paperDimensions?:   PaperDimensions
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Paper({
  text, charOffset, pageIndex, options, pageStyle = 'ruled', isPending = false,
  editable = false, rawText, onTextChange,
  highlights, pageStringOffset = 0, onAddHighlight, onRemoveHighlight,
  textOffsetX = 0, textOffsetY = 0, onShift,
  paperDimensions,
}: PaperProps) {
  // Resolve paper geometry — fall back to A4 constants when no override is given
  const pw  = paperDimensions?.width        ?? PAGE_WIDTH
  const ph  = paperDimensions?.height       ?? PAGE_HEIGHT
  const mT  = paperDimensions?.marginTop    ?? MARGIN_TOP
  const mB  = paperDimensions?.marginBottom ?? MARGIN_BOTTOM
  const mL  = paperDimensions?.marginLeft   ?? MARGIN_LEFT
  const mR  = paperDimensions?.marginRight  ?? MARGIN_RIGHT
  const rlX = paperDimensions?.redLineX     ?? RED_LINE_X
  const hpy = paperDimensions?.holePunchY   ?? ([180, 560, 940] as [number, number, number])

  const editableRef    = useRef<HTMLDivElement>(null)
  const pageRef        = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)
  const isComposingRef = useRef(false)

  // Initialize contentEditable content once (uncontrolled pattern)
  useEffect(() => {
    if (initializedRef.current) return
    const el = editableRef.current
    if (!el || !editable || rawText === undefined) return
    initializedRef.current = true
    el.innerText = rawText
  }, [editable, rawText])

  const { toolbarPos, setToolbarPos, handleSelectionChange, handleAddHighlight, handleClearHighlight } =
    useSelection({ editableRef, pageRef, highlights, onAddHighlight, onRemoveHighlight })

  const nodes = useMemo<ReactNode[]>(() => {
    if (!text && pageIndex > 0) return []
    return renderHandwriting(text, {
      ...options,
      charIndexOffset:  charOffset,
      pageStringOffset,
      highlights,
    })
  }, [text, charOffset, options, pageIndex, highlights, pageStringOffset])

  const { messiness = 30, inkColor = '#1a1a2e', fontSize = '15px', blur = 0.2 } = options
  const fontSizePx    = (typeof fontSize === 'string' ? parseFloat(fontSize) : fontSize) || 15
  const ruleSpacingPx = fontSizePx * 1.9
  const noiseId       = `inkify-noise-${pageIndex}`
  const effectiveBlur = Math.min(2, blur + (messiness / 100) * 0.30)

  return (
    <div
      ref={pageRef}
      id={`inkify-page-${pageIndex}`}
      data-page={pageIndex}
      style={{
        position:        'relative',
        width:           pw,
        height:          ph,
        flexShrink:      0,
        backgroundColor: '#ffffff',
        boxShadow:       '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
        borderRadius:    2,
        overflow:        'hidden',
        opacity:         isPending ? 0.55 : 1,
        transition:      'opacity 0.15s ease',
      }}
    >

      {/* ── Ruled lines ──────────────────────────────────────────────────── */}
      {pageStyle === 'ruled' && (
        <div
          aria-hidden
          style={{
            position:           'absolute',
            inset:              0,
            backgroundImage:    `repeating-linear-gradient(transparent, transparent ${ruleSpacingPx - 1}px, #e8e8f0 ${ruleSpacingPx - 1}px, #e8e8f0 ${ruleSpacingPx}px)`,
            backgroundPosition: `0 ${mT}px`,
            backgroundSize:     `100% ${ruleSpacingPx}px`,
            pointerEvents:      'none',
          }}
        />
      )}

      {/* ── Red margin line ───────────────────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position:      'absolute',
          top:           0,
          bottom:        0,
          left:          rlX,
          width:         1.5,
          background:    'rgba(220, 38, 38, 0.22)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Hole-punch decoration ─────────────────────────────────────────── */}
      {hpy.map((y) => (
        <div
          key={y}
          aria-hidden
          style={{
            position:      'absolute',
            left:          20,
            top:           y,
            width:         14,
            height:        14,
            borderRadius:  '50%',
            border:        '1.5px solid #d1d5db',
            background:    '#f9fafb',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* ── SVG noise filter definition ───────────────────────────────────── */}
      <svg aria-hidden width={0} height={0} style={{ position: 'absolute', pointerEvents: 'none' }}>
        <defs>
          <filter id={noiseId} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.80 0.70" numOctaves={3} seed={pageIndex + 1} stitchTiles="stitch" result="noise" />
            <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
            <feComposite in="grayNoise" in2="SourceGraphic" operator="in" result="maskedNoise" />
            <feBlend in="SourceGraphic" in2="maskedNoise" mode="soft-light" />
          </filter>
        </defs>
      </svg>

      {/* ── Writing-container boundary (subtle dashed indicator) ──────────── */}
      <div
        aria-hidden
        style={{
          position:      'absolute',
          top:           mT,
          left:          mL,
          right:         mR,
          bottom:        mB,
          border:        '1px dashed rgba(120, 120, 180, 0.10)',
          borderRadius:  1,
          pointerEvents: 'none',
          zIndex:        1,
        }}
      />

      {/* ── Text layer ────────────────────────────────────────────────────── */}
      <TextLayer
        nodes={nodes}
        isFirstPage={pageIndex === 0}
        editable={editable}
        rawText={rawText}
        inkColor={inkColor}
        fontSize={fontSize}
        effectiveBlur={effectiveBlur}
        noiseId={noiseId}
        textOffsetX={textOffsetX}
        textOffsetY={textOffsetY}
        mT={mT} mL={mL} mR={mR} mB={mB}
        editableRef={editableRef}
        isComposingRef={isComposingRef}
        onTextChange={onTextChange}
        onShift={onShift}
        onSelectionChange={handleSelectionChange}
        onClearToolbar={() => setToolbarPos(null)}
      />

      {/* ── Highlight toolbar ─────────────────────────────────────────────── */}
      {editable && toolbarPos && (
        <HighlightToolbar
          top={toolbarPos.top}
          left={toolbarPos.left}
          onColor={handleAddHighlight}
          onClear={handleClearHighlight}
        />
      )}

      {/* ── Page number ───────────────────────────────────────────────────── */}
      <div
        aria-label={`Page ${pageIndex + 1}`}
        style={{
          position:      'absolute',
          bottom:        16,
          left:          0,
          right:         0,
          textAlign:     'center',
          fontSize:      10,
          color:         '#d1d5db',
          fontFamily:    'system-ui, sans-serif',
          letterSpacing: '0.1em',
          userSelect:    'none',
          pointerEvents: 'none',
        }}
      >
        — {pageIndex + 1} —
      </div>
    </div>
  )
}

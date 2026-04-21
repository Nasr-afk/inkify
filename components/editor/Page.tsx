'use client'

import { useMemo, useRef, useEffect, useState } from 'react'
import type { ReactNode }                        from 'react'
import { renderHandwriting }                     from '@/lib/handwritingEngine'
import type { HandwritingOptions }               from '@/lib/handwritingEngine'
import type { PageStyle, Highlight }             from '@/lib/store'
import type { PaperDimensions }                  from '@/lib/paper'
import { HighlightToolbar }                      from './HighlightToolbar'

// ─── A4 constants (px at 96 dpi) ─────────────────────────────────────────────
export const PAGE_WIDTH    = 794
export const PAGE_HEIGHT   = 1123
export const MARGIN_TOP    = 72
export const MARGIN_BOTTOM = 48
export const MARGIN_LEFT   = 80   // content starts here (past the red line)
export const MARGIN_RIGHT  = 48
export const RED_LINE_X    = 60   // left red margin line position

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PageProps {
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
  /** Override A4 defaults with a different paper size's dimensions */
  paperDimensions?:   PaperDimensions
}

// ─── Component ────────────────────────────────────────────────────────────────

const SHIFT_STEP = 8   // px per arrow press
const OFFSET_MAX = 60

export function Page({
  text, charOffset, pageIndex, options, pageStyle = 'ruled', isPending = false,
  editable = false, rawText, onTextChange,
  highlights, pageStringOffset = 0, onAddHighlight, onRemoveHighlight,
  textOffsetX = 0, textOffsetY = 0, onShift,
  paperDimensions,
}: PageProps) {
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

  type ToolbarPos = { top: number; left: number; start: number; end: number }
  const [toolbarPos, setToolbarPos] = useState<ToolbarPos | null>(null)

  useEffect(() => {
    if (initializedRef.current) return
    const el = editableRef.current
    if (!el || !editable || rawText === undefined) return
    initializedRef.current = true
    el.innerText = rawText
  }, [editable, rawText])

  // Dismiss toolbar when clicking outside it
  useEffect(() => {
    if (!toolbarPos) return
    function onDown(e: MouseEvent) {
      const toolbar = pageRef.current?.querySelector('[role="toolbar"]')
      if (!toolbar?.contains(e.target as Node)) setToolbarPos(null)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [toolbarPos])

  function handleSelectionChange() {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.rangeCount) { setToolbarPos(null); return }
    const el   = editableRef.current
    const page = pageRef.current
    if (!el || !page) return
    const range = sel.getRangeAt(0)
    if (!el.contains(range.commonAncestorContainer)) { setToolbarPos(null); return }

    // Compute char offsets within the contentEditable plain text
    const before = range.cloneRange()
    before.selectNodeContents(el)
    before.setEnd(range.startContainer, range.startOffset)
    const start = before.toString().length

    const beforeEnd = range.cloneRange()
    beforeEnd.selectNodeContents(el)
    beforeEnd.setEnd(range.endContainer, range.endOffset)
    const end = beforeEnd.toString().length

    if (start === end) { setToolbarPos(null); return }

    const selRect  = range.getBoundingClientRect()
    const pageRect = page.getBoundingClientRect()
    setToolbarPos({
      top:   selRect.top  - pageRect.top  - 44,
      left:  selRect.left - pageRect.left + selRect.width / 2,
      start,
      end,
    })
  }

  function handleAddHighlight(color: string) {
    if (!toolbarPos) return
    onAddHighlight?.(toolbarPos.start, toolbarPos.end, color)
    window.getSelection()?.removeAllRanges()
    setToolbarPos(null)
  }

  function handleClearHighlight() {
    if (!toolbarPos || !highlights) return
    const { start, end } = toolbarPos
    highlights
      .filter((h) => h.start < end && h.end > start)
      .forEach((h) => onRemoveHighlight?.(h.id))
    window.getSelection()?.removeAllRanges()
    setToolbarPos(null)
  }

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
  // Effective blur: user-set base + automatic messiness contribution, capped at 2px
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

      {/* ── Ruled lines (hidden when pageStyle is plain) ─────────────────── */}
      {pageStyle === 'ruled' && (
        <div
          aria-hidden
          style={{
            position:   'absolute',
            inset:      0,
            backgroundImage:    `repeating-linear-gradient(
              transparent,
              transparent ${ruleSpacingPx - 1}px,
              #e8e8f0 ${ruleSpacingPx - 1}px,
              #e8e8f0 ${ruleSpacingPx}px
            )`,
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

      {/* ── SVG noise filter definition (hidden, referenced by id below) ──── */}
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

      {/* ── Writing-container boundary (subtle indicator, pointer-events:none) */}
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

      {/* ── Content area ──────────────────────────────────────────────────── */}
      <div
        style={{
          position:   'absolute',
          top:        mT,
          left:       mL,
          right:      mR,
          bottom:     mB,
          overflow:   'hidden',
          transform:  `translate(${textOffsetX}px, ${textOffsetY}px)`,
          transition: 'transform 0.15s ease',
        }}
      >

        {/* Handwriting render — pointer-events disabled when editable so
            clicks fall through to the contentEditable overlay */}
        {nodes.length > 0 ? (
          <div
            className="break-words"
            style={{
              lineHeight:    1.9,
              color:         inkColor,
              opacity:       0.92,
              filter:        `url(#${noiseId}) blur(${effectiveBlur.toFixed(3)}px)`,
              transition:    'filter 0.2s ease',
              pointerEvents: editable ? 'none' : undefined,
            }}
          >
            {nodes}
          </div>
        ) : (
          // Empty-state placeholder shown for non-editable first page
          !editable && pageIndex === 0 && (
            <div
              style={{
                height:         '100%',
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            12,
                userSelect:     'none',
                pointerEvents:  'none',
              }}
            >
              <span style={{ fontSize: 28, opacity: 0.15 }}>✦</span>
              <p style={{ fontSize: 13, color: '#d1d5db' }}>
                Start typing to see your handwriting
              </p>
            </div>
          )
        )}

        {/* ── Editable overlay (page 0 only) ──────────────────────────────── */}
        {editable && (
          <>
            {/* Placeholder visible while the page is empty */}
            {!rawText && (
              <div
                aria-hidden
                style={{
                  position:       'absolute',
                  inset:          0,
                  display:        'flex',
                  flexDirection:  'column',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:            12,
                  userSelect:     'none',
                  pointerEvents:  'none',
                }}
              >
                <span style={{ fontSize: 28, opacity: 0.15 }}>✦</span>
                <p style={{ fontSize: 13, color: '#d1d5db' }}>
                  Click here and start typing…
                </p>
              </div>
            )}

            {/* Transparent div that captures all keyboard input.
                The caret is visible; the text itself is transparent so
                only the handwriting render below shows through. */}
            <div
              ref={editableRef}
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              onCompositionStart={() => { isComposingRef.current = true }}
              onCompositionEnd={(e) => {
                isComposingRef.current = false
                onTextChange?.(e.currentTarget.innerText)
              }}
              onMouseUp={handleSelectionChange}
              onKeyUp={handleSelectionChange}
              onKeyDown={(e) => {
                if (!e.altKey) return
                const map: Record<string, [number, number]> = {
                  ArrowUp:    [0, -SHIFT_STEP],
                  ArrowDown:  [0, +SHIFT_STEP],
                  ArrowLeft:  [-SHIFT_STEP, 0],
                  ArrowRight: [+SHIFT_STEP, 0],
                }
                const delta = map[e.key]
                if (!delta) return
                e.preventDefault()
                onShift?.(delta[0], delta[1])
              }}
              onInput={(e) => {
                setToolbarPos(null)
                if (isComposingRef.current) return
                onTextChange?.(e.currentTarget.innerText)
              }}
              onPaste={(e) => {
                e.preventDefault()
                const plain = e.clipboardData.getData('text/plain')
                const sel = window.getSelection()
                if (!sel?.rangeCount) return
                const range = sel.getRangeAt(0)
                range.deleteContents()
                const node = document.createTextNode(plain)
                range.insertNode(node)
                // Move caret to end of inserted text
                range.setStartAfter(node)
                range.collapse(true)
                sel.removeAllRanges()
                sel.addRange(range)
                onTextChange?.(e.currentTarget.innerText)
              }}
              style={{
                position:   'absolute',
                inset:      0,
                color:      'transparent',
                caretColor: inkColor,
                lineHeight: 1.9,
                fontSize:   typeof fontSize === 'string' ? fontSize : `${fontSize}px`,
                whiteSpace: 'pre-wrap',
                wordBreak:  'break-word',
                outline:    'none',
                cursor:     'text',
                overflowY:  'hidden',
              }}
            />
          </>
        )}
      </div>

      {/* ── Highlight toolbar (appears above text selection) ─────────────── */}
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

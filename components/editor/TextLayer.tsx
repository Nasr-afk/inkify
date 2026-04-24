'use client'

import { useMemo, useRef, useEffect } from 'react'
import { renderHandwriting } from '@/lib/handwritingEngine'
import type { HandwritingOptions } from '@/lib/handwritingEngine'
import type { Highlight, BlurRange } from '@/lib/store'
import { useSelection } from '@/hooks/useSelection'
import { HighlightToolbar } from './HighlightToolbar'

const SHIFT_STEP = 8

export interface TextLayerProps {
  text:             string
  charOffset:       number
  pageStringOffset: number
  options:          HandwritingOptions
  highlights?:      Highlight[]
  blurRanges?:      BlurRange[]
  isFirstPage:      boolean
  editable:         boolean
  rawText?:         string
  inkColor:         string
  fontSize:         string | number
  effectiveBlur:    number
  noiseId:          string
  textOffsetX:      number   // user-controlled — moves both editable and render together
  textOffsetY:      number
  renderOffsetX?:   number   // visual-only jitter for handwriting render only
  renderOffsetY?:   number
  renderTiltDeg?:   number   // visual-only rotation for handwriting render only
  // false (default) = single contentEditable layer, no render, perfect cursor
  // true            = full handwriting render + transparent editable (cursor only)
  previewMode?:     boolean
  printMode?:       boolean
  onTextChange?:    (text: string) => void
  onShift?:         (dx: number, dy: number) => void
  onAddHighlight?:  (start: number, end: number, color: string) => void
  onRemoveHighlight?: (id: string) => void
  onAddBlur?:       (start: number, end: number, amount: number) => void
  onRemoveBlur?:    (id: string) => void
}

export function TextLayer({
  text, charOffset, pageStringOffset, options, highlights, blurRanges,
  isFirstPage, editable, rawText, inkColor, fontSize, effectiveBlur, noiseId,
  textOffsetX, textOffsetY, renderOffsetX = 0, renderOffsetY = 0, renderTiltDeg = 0,
  previewMode = false, printMode = false,
  onTextChange, onShift, onAddHighlight, onRemoveHighlight, onAddBlur, onRemoveBlur,
}: TextLayerProps) {
  const fontSizeStr = typeof fontSize === 'string' ? fontSize : `${fontSize}px`
  const fontFamily  = options.fontFamily ?? 'serif'
  const effectiveLineHeight = Number(options.lineHeight ?? 1.9)
  const editableRef    = useRef<HTMLDivElement>(null)
  const pageRef        = useRef<HTMLDivElement>(null)
  const isComposingRef = useRef(false)
  const initializedRef = useRef(false)

  // Render layer is active for non-editable pages (always) and for editable page in preview/print mode
  const showRender = !editable || previewMode || printMode

  useEffect(() => {
    if (initializedRef.current) return
    const el = editableRef.current
    if (!el || !editable || rawText === undefined) return
    initializedRef.current = true
    el.innerText = rawText
  }, [editable, rawText])

  // Skip the expensive handwriting computation when render layer is not visible
  const nodes = useMemo(() => {
    if (!showRender) return []
    if (!text && !isFirstPage) return []
    return renderHandwriting(text, {
      ...options,
      charIndexOffset: charOffset,
      pageStringOffset,
      highlights,
      blurRanges,
      printMode,
    })
  }, [showRender, text, isFirstPage, options, charOffset, pageStringOffset, highlights, blurRanges, printMode])

  const {
    toolbarPos, setToolbarPos,
    handleSelectionChange, handleAddHighlight, handleClearHighlight,
    handleAddBlur, handleClearBlur,
  } = useSelection({
    editableRef, pageRef, highlights, blurRanges,
    onAddHighlight, onRemoveHighlight, onAddBlur, onRemoveBlur,
  })

  return (
    <div
      ref={pageRef}
      style={{
        position:   'absolute',
        inset:      0,
        overflow:   'hidden',
        transform:  `translate(${textOffsetX}px, ${textOffsetY}px)`,
        transition: 'transform 0.15s ease',
      }}
    >
      {/* ── SVG noise filter — only needed when render layer is active ──── */}
      {showRender && (
        <svg aria-hidden width={0} height={0} style={{ position: 'absolute', pointerEvents: 'none' }}>
          <defs>
            <filter id={noiseId} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
              <feTurbulence type="fractalNoise" baseFrequency="0.80 0.70" numOctaves={3} seed={7} stitchTiles="stitch" result="noise" />
              <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
              <feComposite in="grayNoise" in2="SourceGraphic" operator="in" result="maskedNoise" />
              <feBlend in="SourceGraphic" in2="maskedNoise" mode="soft-light" />
            </filter>
          </defs>
        </svg>
      )}

      {/* ── Handwriting render — active in preview/print or for non-editable pages ── */}
      {showRender && (
        <div
          aria-hidden
          style={{
            position:        'absolute',
            inset:           0,
            pointerEvents:   'none',
            transform:       renderOffsetX || renderOffsetY || renderTiltDeg
              ? `translate(${renderOffsetX}px, ${renderOffsetY}px) rotate(${renderTiltDeg.toFixed(3)}deg)`
              : undefined,
            transformOrigin: 'left top',
          }}
        >
          {nodes.length > 0 ? (
            <div
              className="break-words"
              style={{
                lineHeight:   effectiveLineHeight,
                color:        inkColor,
                opacity:      printMode ? 0.84 : 0.9,
                filter:       `url(#${noiseId}) blur(${(effectiveBlur + (printMode ? 0.06 : 0.02)).toFixed(3)}px) saturate(${printMode ? 0.88 : 0.98})`,
                transition:   'filter 0.2s ease',
                mixBlendMode: 'multiply',
              }}
            >
              {nodes}
            </div>
          ) : (
            !editable && isFirstPage && (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, userSelect: 'none' }}>
                <span style={{ fontSize: 28, opacity: 0.15 }}>✦</span>
                <p style={{ fontSize: 13, color: '#d1d5db' }}>Start typing to see your handwriting</p>
              </div>
            )
          )}
        </div>
      )}

      {/* ── Editable layer (page 0 only) ──────────────────────────────────── */}
      {editable && (
        <>
          {/* Placeholder — only visible in typing mode with no text */}
          {!rawText && !previewMode && (
            <div
              aria-hidden
              style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 12,
                userSelect: 'none', pointerEvents: 'none',
              }}
            >
              <span style={{ fontSize: 28, opacity: 0.15 }}>✦</span>
              <p style={{ fontSize: 13, color: '#d1d5db' }}>Click here and start typing…</p>
            </div>
          )}

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
            onKeyUp={(e) => {
              if (e.shiftKey || e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End') {
                handleSelectionChange()
              }
            }}
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
              range.setStartAfter(node)
              range.collapse(true)
              sel.removeAllRanges()
              sel.addRange(range)
              onTextChange?.(e.currentTarget.innerText)
            }}
            style={{
              position:   'absolute',
              inset:      0,
              lineHeight: effectiveLineHeight,
              fontSize:   fontSizeStr,
              fontFamily,
              whiteSpace: 'pre-wrap',
              wordBreak:  'break-word',
              outline:    'none',
              cursor:     'text',
              overflowY:  'hidden',
              fontVariantLigatures: 'none' as const,
              caretColor: inkColor,
              // Typing mode: contentEditable IS the visible text — no render layer
              // Preview mode: nearly transparent — render layer shows beneath it
              ...(previewMode
                ? { color: 'rgba(17,24,39,0.015)' }
                : { color: inkColor, opacity: 0.9, letterSpacing: '-0.01em' }
              ),
            }}
          />
        </>
      )}

      {editable && toolbarPos && (
        <HighlightToolbar
          top={toolbarPos.top}
          left={toolbarPos.left}
          onColor={handleAddHighlight}
          onClear={handleClearHighlight}
          onBlur={handleAddBlur}
          onClearBlur={handleClearBlur}
        />
      )}
    </div>
  )
}

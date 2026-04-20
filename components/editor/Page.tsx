'use client'

import { useMemo, useRef, useEffect } from 'react'
import type { ReactNode }             from 'react'
import { renderHandwriting }          from '@/lib/handwritingEngine'
import type { HandwritingOptions }    from '@/lib/handwritingEngine'
import type { PageStyle }             from '@/lib/store'

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
  /** Text content for this page only */
  text:          string
  /** Global character offset — passed to engine for stable transform seeding */
  charOffset:    number
  /** 0-based page number — shown as a footer label */
  pageIndex:     number
  /** Handwriting visual options */
  options:       HandwritingOptions
  /** Controls ruled-line visibility */
  pageStyle?:    PageStyle
  /** Reduce opacity while debounce is pending */
  isPending?:    boolean
  /** When true, renders a transparent contentEditable overlay for direct typing */
  editable?:     boolean
  /** Full raw text value for the contentEditable (only used when editable=true) */
  rawText?:      string
  /** Called with the full text on every keystroke (only used when editable=true) */
  onTextChange?: (text: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Page({
  text, charOffset, pageIndex, options, pageStyle = 'ruled', isPending = false,
  editable = false, rawText, onTextChange,
}: PageProps) {

  const editableRef    = useRef<HTMLDivElement>(null)
  // Guard: only write to the DOM once (on mount). After that the element is
  // uncontrolled — React re-renders never touch its content, so the browser
  // owns cursor position entirely.
  const initializedRef = useRef(false)
  // Tracks IME composition so intermediate characters (CJK, accents, etc.)
  // don't flood the store mid-compose.
  const isComposingRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return
    const el = editableRef.current
    if (!el || !editable || rawText === undefined) return
    initializedRef.current = true
    el.innerText = rawText
  }, [editable, rawText])

  // Each page independently memoises its render.
  // Editing page 1 does not invalidate page 3's nodes.
  const nodes = useMemo<ReactNode[]>(() => {
    if (!text && pageIndex > 0) return []
    return renderHandwriting(text, {
      ...options,
      charIndexOffset: charOffset,
    })
  }, [text, charOffset, options, pageIndex])

  const { messiness = 30, inkColor = '#1a1a2e', fontSize = '15px' } = options
  const fontSizePx    = (typeof fontSize === 'string' ? parseFloat(fontSize) : fontSize) || 15
  const ruleSpacingPx = fontSizePx * 1.9

  return (
    <div
      id={`inkify-page-${pageIndex}`}
      data-page={pageIndex}
      style={{
        position:        'relative',
        width:           PAGE_WIDTH,
        height:          PAGE_HEIGHT,
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
            backgroundPosition: `0 ${MARGIN_TOP}px`,
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
          left:          RED_LINE_X,
          width:         1.5,
          background:    'rgba(220, 38, 38, 0.22)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Hole-punch decoration ─────────────────────────────────────────── */}
      {[180, 560, 940].map((y) => (
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

      {/* ── Content area ──────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top:      MARGIN_TOP,
          left:     MARGIN_LEFT,
          right:    MARGIN_RIGHT,
          bottom:   MARGIN_BOTTOM,
          // Hard clip — no content escapes the page
          overflow: 'hidden',
          // Container-level blur for messiness ambience
          filter:   `blur(${(messiness / 100) * 0.35}px)`,
          transition: 'filter 0.25s ease',
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
              onInput={(e) => {
                // Skip mid-compose events (IME: CJK, accents, etc.)
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

'use client'

import { useMemo }            from 'react'
import type { ReactNode }     from 'react'
import { renderHandwriting }  from '@/lib/handwritingEngine'
import type { HandwritingOptions } from '@/lib/handwritingEngine'

// ─── A4 constants (px at 96 dpi) ─────────────────────────────────────────────
export const PAGE_WIDTH   = 794
export const PAGE_HEIGHT  = 1123
export const MARGIN_TOP   = 72
export const MARGIN_BOTTOM = 48
export const MARGIN_LEFT  = 80   // content starts here (past the red line)
export const MARGIN_RIGHT = 48
export const RED_LINE_X   = 60   // left red margin line position

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PageProps {
  /** Text content for this page only */
  text:         string
  /** Global character offset — passed to engine for stable transform seeding */
  charOffset:   number
  /** 0-based page number — shown as a footer label */
  pageIndex:    number
  /** Handwriting visual options */
  options:      HandwritingOptions
  /** Reduce opacity while debounce is pending */
  isPending?:   boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Page({
  text, charOffset, pageIndex, options, isPending = false,
}: PageProps) {

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
  // Parse fontSize so rule spacing always tracks the actual text size
  const fontSizePx     = typeof fontSize === 'string' ? parseFloat(fontSize) : fontSize
  const ruleSpacingPx  = fontSizePx * 1.9

  return (
    <div
      // Each page gets a stable id for html2canvas export targeting
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

      {/* ── Ruled lines ───────────────────────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position:   'absolute',
          inset:      0,
          // Lines start at MARGIN_TOP so the first rule aligns with first text line
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

      {/* ── Red margin line ───────────────────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position:   'absolute',
          top:        0,
          bottom:     0,
          left:       RED_LINE_X,
          width:      1.5,
          background: 'rgba(220, 38, 38, 0.22)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Top hole-punch area (decorative) ─────────────────────────────── */}
      {[180, 560, 940].map((y) => (
        <div
          key={y}
          aria-hidden
          style={{
            position:     'absolute',
            left:         20,
            top:          y,
            width:        14,
            height:       14,
            borderRadius: '50%',
            border:       '1.5px solid #d1d5db',
            background:   '#f9fafb',
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
        {nodes.length > 0 ? (
          <div
            className="break-words"
            style={{ lineHeight: 1.9, color: inkColor }}
          >
            {nodes}
          </div>
        ) : (
          // Blank page (page 1 empty state OR overflow pages with no content)
          pageIndex === 0 && (
            <div
              style={{
                height:         '100%',
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            12,
                userSelect:     'none',
              }}
            >
              <span style={{ fontSize: 28, opacity: 0.15 }}>✦</span>
              <p style={{ fontSize: 13, color: '#d1d5db' }}>
                Start typing to see your handwriting
              </p>
            </div>
          )
        )}
      </div>

      {/* ── Page number ───────────────────────────────────────────────────── */}
      <div
        aria-label={`Page ${pageIndex + 1}`}
        style={{
          position:   'absolute',
          bottom:     16,
          left:       0,
          right:      0,
          textAlign:  'center',
          fontSize:   10,
          color:      '#d1d5db',
          fontFamily: 'system-ui, sans-serif',
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

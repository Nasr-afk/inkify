'use client'

import type { ReactNode } from 'react'
import type { PageStyle } from '@/lib/store'
import type { PaperDimensions } from '@/lib/paperEngine'
import type { BackgroundPreset } from '@/lib/backgrounds'
import { getBackgroundDef } from '@/lib/backgrounds'

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
  pageIndex:          number
  pageStyle?:         PageStyle
  backgroundColor?:   string
  backgroundPreset?:  BackgroundPreset
  backgroundImageUrl?: string
  printMode?:        boolean
  isPending?:         boolean
  paperDimensions?:   PaperDimensions
  children?:          ReactNode
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Paper({
  pageIndex,
  pageStyle = 'ruled',
  backgroundColor = '#ffffff',
  backgroundPreset = 'plain-paper',
  backgroundImageUrl,
  printMode = false,
  isPending = false,
  paperDimensions,
  children,
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

  const fontSizePx = 16
  const ruleSpacingPx = fontSizePx * 1.9
  const backgroundDef = getBackgroundDef(backgroundPreset)
  const resolvedImage = backgroundPreset === 'custom-image' ? backgroundImageUrl : backgroundDef.imageUrl

  const writingBounds = {
    top: mT,
    left: Math.max(mL, rlX + 18),
    right: mR,
    bottom: mB + 8,
  }

  return (
    <div
      id={`inkify-page-${pageIndex}`}
      data-page={pageIndex}
      data-print-mode={printMode ? '1' : '0'}
      style={{
        position:        'relative',
        width:           pw,
        height:          ph,
        flexShrink:      0,
        backgroundColor,
        backgroundImage: resolvedImage ? `url(${resolvedImage})` : undefined,
        backgroundSize: resolvedImage ? 'cover' : undefined,
        backgroundRepeat: resolvedImage ? 'no-repeat' : undefined,
        backgroundPosition: resolvedImage ? 'center center' : undefined,
        boxShadow:       '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
        borderRadius:    2,
        overflow:        'hidden',
        opacity:         isPending ? 0.55 : 1,
        transition:      'opacity 0.15s ease',
      }}
    >

      {/* ── Ruled lines ──────────────────────────────────────────────────── */}
      {pageStyle === 'ruled' && !resolvedImage && (
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

      {pageStyle === 'custom' && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle at 25% 10%, rgba(0,0,0,0.05), transparent 45%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Subtle paper realism overlay (texture + grain) */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            radial-gradient(circle at 18% 14%, rgba(255,255,255,0.14), transparent 42%),
            radial-gradient(circle at 76% 82%, rgba(0,0,0,0.035), transparent 36%)
          `,
          mixBlendMode: 'multiply',
          opacity: 0.75,
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-radial-gradient(circle at 0 0, rgba(0,0,0,0.018) 0 0.7px, transparent 0.7px 2.2px)',
          opacity: 0.42,
          pointerEvents: 'none',
        }}
      />

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

      {/* ── Writing-container boundary (subtle dashed indicator) ──────────── */}
      <div
        aria-hidden
        style={{
          position:      'absolute',
          top:           writingBounds.top,
          left:          writingBounds.left,
          right:         writingBounds.right,
          bottom:        writingBounds.bottom,
          border:        '1px dashed rgba(120, 120, 180, 0.10)',
          borderRadius:  1,
          pointerEvents: 'none',
          zIndex:        1,
        }}
      />

      <div
        data-writing-mask
        style={{
          position: 'absolute',
          top: writingBounds.top,
          left: writingBounds.left,
          right: writingBounds.right,
          bottom: writingBounds.bottom,
          overflow: 'hidden',
          zIndex: 2,
        }}
      >
        {children}
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

/**
 * lib/paginator.ts
 *
 * Splits a plain-text string into page-sized chunks suitable for A4 rendering.
 *
 * Algorithm:
 *   1. Word-wrap text into visual lines (respecting explicit \n)
 *   2. Group lines into pages (respecting linesPerPage)
 *   3. Return each page's text slice + its global char offset
 *
 * All inputs are in px. The caller supplies the font/size so char-width
 * estimates can be tuned per font style.
 *
 * This is intentionally an estimate, not pixel-perfect layout. The goal is
 * "close enough that pages look right" — not "identical to a browser reflow".
 */

import type { FontStyle } from '@/lib/store'
import { getFontDef }    from '@/lib/fonts'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaginatorOptions {
  fontStyle?:    FontStyle
  fontSize?:     number     // px — default 15
  lineHeight?:   number     // multiplier — default 1.9
  pageWidth?:    number     // px — default 794 (A4)
  pageHeight?:   number     // px — default 1123 (A4)
  marginTop?:    number     // px — default 72
  marginBottom?: number     // px — default 48
  marginLeft?:   number     // px — past the red line — default 80
  marginRight?:  number     // px — default 48
}

export interface PageSlice {
  text:        string   // the text content for this page
  charOffset:  number   // global char index where this page starts
  pageIndex:   number   // 0-based
}

// ─── Word-wrapper ─────────────────────────────────────────────────────────────

/**
 * Wrap `text` into visual lines of at most `charsPerLine` characters.
 * Explicit \n always forces a new line.
 * Returns an array of line strings (without \n).
 */
function wrapIntoLines(text: string, charsPerLine: number): string[] {
  const lines: string[] = []
  const paragraphs = text.split('\n')

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const para = paragraphs[pIdx]

    // Empty paragraph → blank line (preserves intentional vertical space)
    if (para.length === 0) {
      lines.push('')
      continue
    }

    const words = para.split(' ')
    let current = ''

    for (const word of words) {
      if (!current) {
        // Very long single word — force-break at charsPerLine
        if (word.length > charsPerLine) {
          for (let i = 0; i < word.length; i += charsPerLine) {
            lines.push(word.slice(i, i + charsPerLine))
          }
        } else {
          current = word
        }
      } else if (current.length + 1 + word.length <= charsPerLine) {
        current += ' ' + word
      } else {
        lines.push(current)
        current = word
      }
    }

    if (current) lines.push(current)
  }

  return lines
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Split `text` into page-sized slices for A4 rendering.
 *
 * Returns at least one PageSlice (even for empty text, so the UI always
 * shows at least one blank page).
 */
export function paginateText(
  text: string,
  opts: PaginatorOptions = {}
): PageSlice[] {
  const {
    fontStyle    = 'serif',
    fontSize     = 15,
    lineHeight   = 1.9,
    pageWidth    = 794,
    pageHeight   = 1123,
    marginTop    = 72,
    marginBottom = 48,
    marginLeft   = 80,
    marginRight  = 48,
  } = opts

  // ── Geometry ──────────────────────────────────────────────────────────────
  const usableWidth  = pageWidth  - marginLeft  - marginRight
  const usableHeight = pageHeight - marginTop   - marginBottom
  const lineHeightPx = fontSize * lineHeight
  const avgCharWidth = getFontDef(fontStyle).avgCharWidth
  const charsPerLine = Math.floor(usableWidth / avgCharWidth)

  // Use 92% capacity as a safety margin against handwriting transforms
  // pushing characters slightly outside their bounding box
  const linesPerPage = Math.floor((usableHeight / lineHeightPx) * 0.92)

  // ── Edge case: empty text ─────────────────────────────────────────────────
  if (!text) {
    return [{ text: '', charOffset: 0, pageIndex: 0 }]
  }

  // ── Wrap + paginate ────────────────────────────────────────────────────────
  const allLines = wrapIntoLines(text, charsPerLine)
  const pages: PageSlice[] = []
  let globalCharOffset = 0

  for (let i = 0; i < allLines.length; i += linesPerPage) {
    const pageLines = allLines.slice(i, i + linesPerPage)
    const pageText  = pageLines.join('\n')

    pages.push({
      text:       pageText,
      charOffset: globalCharOffset,
      pageIndex:  pages.length,
    })

    // Advance global offset by character count of this page's text
    // +1 per line for the \n that joins them, except the last line
    globalCharOffset += pageText.length + 1
  }

  return pages.length > 0
    ? pages
    : [{ text: '', charOffset: 0, pageIndex: 0 }]
}

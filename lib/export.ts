/**
 * lib/export.ts
 *
 * Multi-page export pipeline for Inkify.
 *
 * Strategy:
 *   1. Collect all [data-page] elements in DOM order
 *   2. Render each to a hi-res canvas via html2canvas (scale: 2)
 *   3a. PDF  → add each canvas as a new jsPDF page
 *   3b. PNG  → export only page 0 at full resolution
 *
 * All imports are dynamic (lazy) to keep the initial JS bundle lean.
 * html2canvas and jsPDF are only fetched when the user triggers an export.
 *
 * Progress is reported via an optional callback so the caller can update UI
 * without this module knowing anything about React state.
 */

import { PAGE_WIDTH, PAGE_HEIGHT } from '@/components/editor/Paper'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ExportFormat   = 'pdf' | 'png'
export type ExportProgress =
  | { phase: 'idle' }
  | { phase: 'capturing'; current: number; total: number }
  | { phase: 'generating' }
  | { phase: 'done' }
  | { phase: 'error'; message: string }

export interface ExportOptions {
  filename?:  string
  /** Called on each progress update — use to drive UI state */
  onProgress?: (p: ExportProgress) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Collect all page elements in document order */
function collectPageElements(): HTMLElement[] {
  const nodes = document.querySelectorAll<HTMLElement>('[data-page]')
  return Array.from(nodes).sort((a, b) => {
    const ai = Number(a.dataset.page ?? 0)
    const bi = Number(b.dataset.page ?? 0)
    return ai - bi
  })
}

/**
 * Capture a single DOM element to an HTMLCanvasElement.
 * scale: 2 gives retina-quality output at the cost of 4× memory.
 */
async function captureElement(el: HTMLElement): Promise<HTMLCanvasElement> {
  const html2canvas = (await import('html2canvas')).default
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready
  }
  const rect = el.getBoundingClientRect()
  const exportWidth = Math.max(1, Math.round(rect.width))
  const exportHeight = Math.max(1, Math.round(rect.height))
  const captured = await html2canvas(el, {
    scale:          Math.max(2, Math.ceil((typeof window !== 'undefined' ? window.devicePixelRatio : 1) * 1.75)),
    useCORS:        true,
    logging:        false,
    backgroundColor: null,
    foreignObjectRendering: true,
    removeContainer: true,
    scrollX: 0,
    scrollY: 0,
    // Explicitly set dimensions so html2canvas doesn't read scrolled viewports
    width: exportWidth,
    height: exportHeight,
    windowWidth: exportWidth,
    windowHeight: exportHeight,
  })

  const isPrintMode = el.dataset.printMode === '1'
  if (!isPrintMode) return captured

  const tuned = document.createElement('canvas')
  tuned.width = captured.width
  tuned.height = captured.height
  const ctx = tuned.getContext('2d')
  if (!ctx) return captured
  ctx.filter = 'saturate(0.92) contrast(0.95) blur(0.15px)'
  ctx.drawImage(captured, 0, 0)
  return tuned
}

// ─── PDF export ───────────────────────────────────────────────────────────────

/**
 * Capture all [data-page] elements and combine into a single PDF.
 * Each element → one A4 page.
 */
export async function exportToPdf(opts: ExportOptions = {}): Promise<void> {
  const { filename = 'inkify', onProgress } = opts
  const report = (p: ExportProgress) => onProgress?.(p)

  try {
    const pages = collectPageElements()
    if (pages.length === 0) throw new Error('No pages found in the preview.')

    const { jsPDF } = await import('jspdf')

    // First pass: capture all canvases (this is the slow part)
    const canvases: HTMLCanvasElement[] = []
    for (let i = 0; i < pages.length; i++) {
      report({ phase: 'capturing', current: i + 1, total: pages.length })
      canvases.push(await captureElement(pages[i]))
    }

    // Second pass: assemble PDF
    report({ phase: 'generating' })

    const firstRect = pages[0].getBoundingClientRect()
    const pdfWidth = Math.max(1, Math.round(firstRect.width)) || PAGE_WIDTH
    const pdfHeight = Math.max(1, Math.round(firstRect.height)) || PAGE_HEIGHT

    const doc = new jsPDF({
      orientation: 'portrait',
      unit:        'px',
      format:      [pdfWidth, pdfHeight],
      compress:    true,
    })

    for (let i = 0; i < canvases.length; i++) {
      if (i > 0) doc.addPage([pdfWidth, pdfHeight], 'portrait')

      const canvas  = canvases[i]
      const imgData = canvas.toDataURL('image/png')

      // addImage(data, format, x, y, width, height)
      // Canvas is 2× — map back to physical px
      doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    }

    doc.save(`${filename}.pdf`)
    report({ phase: 'done' })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Export failed'
    report({ phase: 'error', message })
    throw err
  }
}

// ─── PNG export ───────────────────────────────────────────────────────────────

/**
 * Capture a single page (default: page 0) and download as PNG.
 * For multi-page PNG, callers can pass a specific pageIndex.
 */
export async function exportToPng(opts: ExportOptions & { pageIndex?: number } = {}): Promise<void> {
  const { filename = 'inkify', pageIndex = 0, onProgress } = opts
  const report = (p: ExportProgress) => onProgress?.(p)

  try {
    const pages = collectPageElements()
    if (pages.length === 0) throw new Error('No pages found in the preview.')

    const target = pages[pageIndex] ?? pages[0]
    report({ phase: 'capturing', current: 1, total: 1 })

    const canvas = await captureElement(target)
    report({ phase: 'generating' })

    const link      = document.createElement('a')
    link.download   = `${filename}-p${pageIndex + 1}.png`
    link.href       = canvas.toDataURL('image/png')
    link.click()

    report({ phase: 'done' })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Export failed'
    report({ phase: 'error', message })
    throw err
  }
}

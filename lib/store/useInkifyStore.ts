import { create }           from 'zustand'
import { generateId }        from '@/lib/utils'
import type { PaperSize }   from '@/lib/paperEngine'
import type { BackgroundPreset } from '@/lib/backgrounds'

export type { PaperSize }
export type { BackgroundPreset }

// ─── Types ────────────────────────────────────────────────────────────────────

export type FontStyle =
  | 'serif'
  | 'sans-serif'
  | 'monospace'
  | 'cursive'
  | 'handwriting'
  | 'inkify-pen'
  | 'inkify-marker'

export const FONT_SIZE_MIN     = 12
export const FONT_SIZE_MAX     = 28
export const FONT_SIZE_DEFAULT = 16
export const TEXT_OFFSET_MIN   = -28
export const TEXT_OFFSET_MAX   = 28

export type PageStyle = 'plain' | 'ruled' | 'custom'

export interface Highlight {
  id:    string
  start: number   // char index in the raw text (selection offset)
  end:   number   // exclusive
  color: string   // CSS color
}

export interface BlurRange {
  id:      string
  start:   number
  end:     number
  amount:  number   // px
}

export interface InkifyState {
  text:       string
  fontStyle:  FontStyle
  fontSize:   number
  inkColor:   string
  messiness:  number
  inkBlur:      number    // 0–2 px, user-controlled blur on handwriting layer
  textOffsetX:  number    // px, horizontal shift of the text block (-60–60)
  textOffsetY:  number    // px, vertical shift of the text block (-60–60)
  paperSize:    PaperSize
  pageStyle:    PageStyle
  customBackground: string
  backgroundPreset: BackgroundPreset
  customBackgroundImage: string
  highlights:   Highlight[]
  blurRanges:   BlurRange[]
  printMode:    boolean

  setText:         (text:  string)              => void
  setFontStyle:    (style: FontStyle)           => void
  setFontSize:     (size:  number)              => void
  setInkColor:     (color: string)              => void
  setMessiness:    (value: number)              => void
  setInkBlur:      (value: number)              => void
  setTextOffsetX:  (value: number)              => void
  setTextOffsetY:  (value: number)              => void
  shiftTextOffset: (dx: number, dy: number)     => void
  resetTextOffset: ()                           => void
  setPaperSize:    (size: PaperSize)            => void
  setPageStyle:    (style: PageStyle)           => void
  setCustomBackground: (color: string)          => void
  setBackgroundPreset: (preset: BackgroundPreset) => void
  setCustomBackgroundImage: (url: string)       => void
  addHighlight:    (h: Omit<Highlight, 'id'>)   => void
  removeHighlight: (id: string)                 => void
  addBlurRange:    (r: Omit<BlurRange, 'id'>)   => void
  removeBlurRange: (id: string)                 => void
  setPrintMode:   (enabled: boolean)            => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useInkifyStore = create<InkifyState>((set) => ({
  text:       '',
  fontStyle:  'handwriting',
  fontSize:   FONT_SIZE_DEFAULT,
  inkColor:   '#1a1a2e',
  messiness:  20,
  inkBlur:      0.2,
  textOffsetX:  0,
  textOffsetY:  0,
  paperSize:    'a4' as PaperSize,
  pageStyle:    'ruled',
  customBackground: '#fef9e7',
  backgroundPreset: 'notebook-page',
  customBackgroundImage: '',
  highlights: [],
  blurRanges: [],
  printMode: false,

  setText:         (text)  => set({ text }),
  setFontStyle:    (style) => set({ fontStyle: style }),
  setFontSize:     (size)  => set({ fontSize: Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, size)) }),
  setInkColor:     (color) => set({ inkColor: color }),
  setMessiness:    (value) => set({ messiness: value }),
  setInkBlur:      (value) => set({ inkBlur: Math.min(2, Math.max(0, value)) }),
  setTextOffsetX:  (value) => set({ textOffsetX: Math.min(TEXT_OFFSET_MAX, Math.max(TEXT_OFFSET_MIN, value)) }),
  setTextOffsetY:  (value) => set({ textOffsetY: Math.min(TEXT_OFFSET_MAX, Math.max(TEXT_OFFSET_MIN, value)) }),
  shiftTextOffset: (dx, dy) => set((s) => ({
    textOffsetX: Math.min(TEXT_OFFSET_MAX, Math.max(TEXT_OFFSET_MIN, s.textOffsetX + dx)),
    textOffsetY: Math.min(TEXT_OFFSET_MAX, Math.max(TEXT_OFFSET_MIN, s.textOffsetY + dy)),
  })),
  resetTextOffset: ()      => set({ textOffsetX: 0, textOffsetY: 0 }),
  setPaperSize:    (size)  => set({ paperSize: size }),
  setPageStyle:    (style) => set({ pageStyle: style }),
  setCustomBackground: (color) => set({ customBackground: color }),
  setBackgroundPreset: (preset) => set({ backgroundPreset: preset }),
  setCustomBackgroundImage: (url) => set({ customBackgroundImage: url }),
  addHighlight:    (h)     => set((s) => ({ highlights: [...s.highlights, { ...h, id: generateId() }] })),
  removeHighlight: (id)    => set((s) => ({ highlights: s.highlights.filter((h) => h.id !== id) })),
  addBlurRange:    (r)     => set((s) => ({ blurRanges: [...s.blurRanges, { ...r, id: generateId() }] })),
  removeBlurRange: (id)    => set((s) => ({ blurRanges: s.blurRanges.filter((r) => r.id !== id) })),
  setPrintMode:    (enabled) => set({ printMode: enabled }),
}))

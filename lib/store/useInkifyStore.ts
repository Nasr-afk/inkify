import { create } from 'zustand'

// ─── Types ────────────────────────────────────────────────────────────────────

export type FontStyle =
  | 'serif'
  | 'sans-serif'
  | 'monospace'
  | 'cursive'
  | 'handwriting'

export const FONT_SIZE_MIN     = 12
export const FONT_SIZE_MAX     = 28
export const FONT_SIZE_DEFAULT = 16

export interface InkifyState {
  text:      string
  fontStyle: FontStyle
  fontSize:  number    // px, clamped to FONT_SIZE_MIN–FONT_SIZE_MAX
  inkColor:  string
  messiness: number

  setText:      (text:  string)    => void
  setFontStyle: (style: FontStyle) => void
  setFontSize:  (size:  number)    => void
  setInkColor:  (color: string)    => void
  setMessiness: (value: number)    => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useInkifyStore = create<InkifyState>((set) => ({
  text:      '',
  fontStyle: 'handwriting',     // default to the nicest font
  fontSize:  FONT_SIZE_DEFAULT,
  inkColor:  '#1a1a2e',
  messiness: 20,

  setText:      (text)  => set({ text }),
  setFontStyle: (style) => set({ fontStyle: style }),
  setFontSize:  (size)  => set({ fontSize: Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, size)) }),
  setInkColor:  (color) => set({ inkColor: color }),
  setMessiness: (value) => set({ messiness: value }),
}))

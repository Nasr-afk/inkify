'use client'

import { useInkifyStore }                      from '@/lib/store'
import { getFontFamily }                        from '@/lib/fonts'
import type { FontStyle, PageStyle, Highlight } from '@/lib/store'

export type { FontStyle, PageStyle, Highlight }

export function useEditor() {
  const {
    text, fontStyle, fontSize, inkColor, messiness, inkBlur,
    textOffsetX, textOffsetY, paperSize, pageStyle, highlights,
    setText, setFontStyle, setFontSize, setInkColor, setMessiness, setInkBlur,
    setTextOffsetX, setTextOffsetY, resetTextOffset, setPaperSize, setPageStyle,
    addHighlight, removeHighlight,
  } = useInkifyStore()

  return {
    text, fontStyle, fontSize, inkColor, messiness, inkBlur,
    textOffsetX, textOffsetY, paperSize, pageStyle, highlights,
    fontFamily: getFontFamily(fontStyle),
    setText, setFontStyle, setFontSize, setInkColor, setMessiness, setInkBlur,
    setTextOffsetX, setTextOffsetY, resetTextOffset, setPaperSize, setPageStyle,
    addHighlight, removeHighlight,
  }
}

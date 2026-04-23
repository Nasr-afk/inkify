'use client'

import { useInkifyStore }                      from '@/lib/store'
import { getFontFamily }                        from '@/lib/fonts'
import type { FontStyle, PageStyle, Highlight, BlurRange } from '@/lib/store'

export type { FontStyle, PageStyle, Highlight, BlurRange }

export function useEditor() {
  const {
    text, fontStyle, fontSize, inkColor, messiness, inkBlur,
    textOffsetX, textOffsetY, paperSize, pageStyle, customBackground, backgroundPreset, customBackgroundImage, highlights, blurRanges, printMode,
    setText, setFontStyle, setFontSize, setInkColor, setMessiness, setInkBlur,
    setTextOffsetX, setTextOffsetY, shiftTextOffset, resetTextOffset, setPaperSize, setPageStyle,
    setCustomBackground, setBackgroundPreset, setCustomBackgroundImage, addHighlight, removeHighlight, addBlurRange, removeBlurRange, setPrintMode,
  } = useInkifyStore()

  return {
    text, fontStyle, fontSize, inkColor, messiness, inkBlur,
    textOffsetX, textOffsetY, paperSize, pageStyle, customBackground, backgroundPreset, customBackgroundImage, highlights, blurRanges, printMode,
    fontFamily: getFontFamily(fontStyle),
    setText, setFontStyle, setFontSize, setInkColor, setMessiness, setInkBlur,
    setTextOffsetX, setTextOffsetY, shiftTextOffset, resetTextOffset, setPaperSize, setPageStyle,
    setCustomBackground, setBackgroundPreset, setCustomBackgroundImage, addHighlight, removeHighlight, addBlurRange, removeBlurRange, setPrintMode,
  }
}

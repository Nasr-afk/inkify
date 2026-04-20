'use client'

import { useInkifyStore }           from '@/lib/store'
import { getFontFamily }             from '@/lib/fonts'
import type { FontStyle, PageStyle } from '@/lib/store'

export type { FontStyle, PageStyle }

export function useEditor() {
  const {
    text, fontStyle, fontSize, inkColor, messiness, pageStyle,
    setText, setFontStyle, setFontSize, setInkColor, setMessiness, setPageStyle,
  } = useInkifyStore()

  return {
    text, fontStyle, fontSize, inkColor, messiness, pageStyle,
    fontFamily: getFontFamily(fontStyle),
    setText, setFontStyle, setFontSize, setInkColor, setMessiness, setPageStyle,
  }
}

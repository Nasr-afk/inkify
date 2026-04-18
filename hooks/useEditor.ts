'use client'

import { useInkifyStore }  from '@/lib/store'
import { getFontFamily }   from '@/lib/fonts'
import type { FontStyle }  from '@/lib/store'

export type { FontStyle }

export function useEditor() {
  const {
    text, fontStyle, fontSize, inkColor, messiness,
    setText, setFontStyle, setFontSize, setInkColor, setMessiness,
  } = useInkifyStore()

  return {
    text, fontStyle, fontSize, inkColor, messiness,
    // Derived — resolved from lib/fonts.ts, not hardcoded here
    fontFamily: getFontFamily(fontStyle),
    setText, setFontStyle, setFontSize, setInkColor, setMessiness,
  }
}

/**
 * lib/paper.ts
 *
 * Paper size definitions (px at 96 dpi) and the writing-container geometry
 * derived from each size. All pixel values assume 96 dpi screen rendering.
 */

export type PaperSize = 'a4' | 'letter' | 'a5'

export interface PaperDimensions {
  /** Display label shown in the UI */
  label:         string
  /** Physical page width in px */
  width:         number
  /** Physical page height in px */
  height:        number
  /** Top margin — space above the first writing line */
  marginTop:     number
  /** Bottom margin — space below the last writing line */
  marginBottom:  number
  /** Left margin — content starts here, past the red margin line */
  marginLeft:    number
  /** Right margin */
  marginRight:   number
  /** X position of the red margin line */
  redLineX:      number
  /** Y positions of the three hole-punch circles */
  holePunchY:    [number, number, number]
}

export const PAPER_SIZES: Record<PaperSize, PaperDimensions> = {
  a4: {
    label:        'A4',
    width:        794,
    height:       1123,
    marginTop:    72,
    marginBottom: 48,
    marginLeft:   80,
    marginRight:  48,
    redLineX:     60,
    holePunchY:   [180, 560, 940],
  },
  letter: {
    label:        'Letter',
    width:        816,
    height:       1056,
    marginTop:    72,
    marginBottom: 48,
    marginLeft:   80,
    marginRight:  48,
    redLineX:     60,
    holePunchY:   [170, 528, 886],
  },
  a5: {
    label:        'A5',
    width:        559,
    height:       794,
    marginTop:    54,
    marginBottom: 36,
    marginLeft:   60,
    marginRight:  36,
    redLineX:     44,
    holePunchY:   [120, 397, 674],
  },
}

export function getPaper(size: PaperSize): PaperDimensions {
  return PAPER_SIZES[size]
}

/** Usable writing area width in px */
export function writingWidth(p: PaperDimensions): number {
  return p.width - p.marginLeft - p.marginRight
}

/** Usable writing area height in px */
export function writingHeight(p: PaperDimensions): number {
  return p.height - p.marginTop - p.marginBottom
}

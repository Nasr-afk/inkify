export type PaperSize = 'a4' | 'letter' | 'a5'

export interface PaperDimensions {
  label:         string
  width:         number
  height:        number
  marginTop:     number
  marginBottom:  number
  marginLeft:    number
  marginRight:   number
  redLineX:      number
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

export function writingWidth(p: PaperDimensions): number {
  return p.width - p.marginLeft - p.marginRight
}

export function writingHeight(p: PaperDimensions): number {
  return p.height - p.marginTop - p.marginBottom
}

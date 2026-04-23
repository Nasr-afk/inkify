export type BackgroundPreset = 'plain-paper' | 'notebook-page' | 'exam-sheet' | 'custom-image'

export interface BackgroundDef {
  value: BackgroundPreset
  label: string
  imageUrl?: string
  estimatedBrightness: number
}

export const BACKGROUNDS: BackgroundDef[] = [
  { value: 'plain-paper', label: 'Plain Paper', imageUrl: '/backgrounds/plain-paper.svg', estimatedBrightness: 0.96 },
  { value: 'notebook-page', label: 'Notebook', imageUrl: '/backgrounds/notebook-paper.svg', estimatedBrightness: 0.95 },
  { value: 'exam-sheet', label: 'Exam Sheet', imageUrl: '/backgrounds/exam-sheet.svg', estimatedBrightness: 0.93 },
  { value: 'custom-image', label: 'Custom', estimatedBrightness: 0.75 },
]

const BACKGROUND_MAP = new Map(BACKGROUNDS.map((bg) => [bg.value, bg]))

export function getBackgroundDef(value: BackgroundPreset): BackgroundDef {
  return BACKGROUND_MAP.get(value) ?? BACKGROUNDS[0]
}

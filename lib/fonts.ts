/**
 * lib/fonts.ts
 *
 * Single source of truth for font metadata.
 *
 * Previously the font-family CSS strings were duplicated in:
 *   - hooks/useEditor.ts
 *   - components/editor/ControlsPanel.tsx
 * Both copies are now removed and import from here instead.
 *
 * Google Fonts are loaded at runtime via <link> tags in app/layout.tsx.
 * We deliberately avoid next/font/google because it fetches fonts at
 * build time — which fails in sandboxed/offline environments. Runtime
 * loading works in any browser regardless of build constraints.
 */

import type { FontStyle } from '@/lib/store'

// ─── Font definitions ─────────────────────────────────────────────────────────

export interface FontDef {
  value:      FontStyle
  label:      string
  /** Actual CSS font-family string used in inline styles */
  family:     string
  /** Google Fonts family name for the <link> preload (null = system font) */
  googleName: string | null
  /** Average character width at 15px — used by paginator for line wrapping */
  avgCharWidth: number
}

export const FONTS: FontDef[] = [
  {
    value:        'serif',
    label:        'Serif',
    family:       'Georgia, "Times New Roman", serif',
    googleName:   null,   // system font — no load needed
    avgCharWidth: 7.8,
  },
  {
    value:        'sans-serif',
    label:        'Sans-serif',
    family:       '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    googleName:   null,
    avgCharWidth: 7.3,
  },
  {
    value:        'monospace',
    label:        'Mono',
    family:       '"SF Mono", "Fira Code", Consolas, monospace',
    googleName:   null,
    avgCharWidth: 9.0,
  },
  {
    value:        'cursive',
    label:        'Cursive',
    family:       '"Caveat", "Brush Script MT", cursive',
    googleName:   'Caveat',
    avgCharWidth: 8.4,
  },
  {
    value:        'handwriting',
    label:        'Handwriting',
    family:       '"Patrick Hand", "Segoe Script", cursive',
    googleName:   'Patrick+Hand',
    avgCharWidth: 8.6,
  },
]

/** Lookup by FontStyle token — O(1) via Map */
const FONT_MAP = new Map<FontStyle, FontDef>(FONTS.map((f) => [f.value, f]))

export function getFontDef(style: FontStyle): FontDef {
  return FONT_MAP.get(style) ?? FONTS[0]
}

export function getFontFamily(style: FontStyle): string {
  return getFontDef(style).family
}

/** All Google Font names that need to be loaded via <link> */
export const GOOGLE_FONT_NAMES = FONTS
  .map((f) => f.googleName)
  .filter((n): n is string => n !== null)

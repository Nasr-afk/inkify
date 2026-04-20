'use client'

import { useEditor }             from '@/hooks/useEditor'
import { FONTS }                  from '@/lib/fonts'
import { FONT_SIZE_MIN, FONT_SIZE_MAX } from '@/lib/store'
import { clsx }                   from 'clsx'

const INK_PRESETS = [
  { color: '#1a1a2e', label: 'Midnight'  },
  { color: '#2d3436', label: 'Charcoal'  },
  { color: '#6c5ce7', label: 'Violet'    },
  { color: '#0984e3', label: 'Sapphire'  },
  { color: '#00b894', label: 'Emerald'   },
  { color: '#e17055', label: 'Rust'      },
  { color: '#d63031', label: 'Crimson'   },
  { color: '#2c3e50', label: 'Navy'      },
]

function messinessLabel(v: number) {
  if (v === 0)  return 'Perfect'
  if (v < 20)   return 'Crisp'
  if (v < 40)   return 'Slight'
  if (v < 60)   return 'Rough'
  if (v < 80)   return 'Chaotic'
  return 'Unhinged'
}

export function ControlsPanel() {
  const {
    fontStyle, fontSize, inkColor, messiness, pageStyle,
    setFontStyle, setFontSize, setInkColor, setMessiness, setPageStyle,
  } = useEditor()

  return (
    <div className="flex items-center justify-center gap-x-5 px-5 py-3">

      {/* ── Font style ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Font
        </label>
        <div className="flex gap-1">
          {FONTS.map(({ value, label, family }) => (
            <button suppressHydrationWarning
              key={value}
              title={label}
              onClick={() => setFontStyle(value)}
              className={clsx(
                'flex flex-col items-center gap-0.5 rounded-lg border px-2.5 py-1.5 transition-all',
                fontStyle === value
                  ? 'border-ink-400 bg-ink-50 text-ink-700 shadow-sm'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <span className="text-base leading-none" style={{ fontFamily: family }}>
                Aa
              </span>
              <span className="text-[9px] tracking-wide">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="hidden h-10 w-px bg-gray-100 lg:block" />

      {/* ── Font size ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Size
        </label>
        <div className="flex items-center gap-1">
          <button suppressHydrationWarning
            onClick={() => setFontSize(fontSize - 1)}
            disabled={fontSize <= FONT_SIZE_MIN}
            aria-label="Decrease font size"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-sm text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-30"
          >
            −
          </button>
          <span className="w-10 text-center text-[13px] font-semibold tabular-nums text-gray-700">
            {fontSize}
          </span>
          <button suppressHydrationWarning
            onClick={() => setFontSize(fontSize + 1)}
            disabled={fontSize >= FONT_SIZE_MAX}
            aria-label="Increase font size"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-sm text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-30"
          >
            +
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="hidden h-10 w-px bg-gray-100 lg:block" />

      {/* ── Ink color ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Ink color
        </label>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {INK_PRESETS.map(({ color, label }) => (
              <button suppressHydrationWarning
                key={color}
                title={label}
                onClick={() => setInkColor(color)}
                className={clsx(
                  'h-6 w-6 rounded-full border-2 transition-transform hover:scale-110',
                  inkColor === color
                    ? 'border-ink-500 scale-110 shadow-md'
                    : 'border-transparent'
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          {/* Custom color picker */}
          <div className="relative h-6 w-6">
            <div
              className="h-full w-full cursor-pointer rounded-full border-2 border-dashed border-gray-300"
              style={{
                backgroundColor: INK_PRESETS.some(p => p.color === inkColor)
                  ? 'transparent'
                  : inkColor,
              }}
              title="Custom color"
            >
              <input
                type="color"
                value={inkColor}
                onChange={(e) => setInkColor(e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
            {/* ✦ marker if custom color is active */}
            {!INK_PRESETS.some(p => p.color === inkColor) && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[8px] text-white">
                ✦
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="hidden h-10 w-px bg-gray-100 lg:block" />

      {/* ── Page lines ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Lines
        </label>
        <div className="flex items-center rounded-md border border-gray-200 text-[11px]">
          {(['ruled', 'plain'] as const).map((style, i) => (
            <button suppressHydrationWarning
              key={style}
              onClick={() => setPageStyle(style)}
              className={clsx(
                'px-2.5 py-1 capitalize transition-colors',
                i === 0 ? 'rounded-l-md' : 'rounded-r-md border-l border-gray-200',
                pageStyle === style
                  ? 'bg-ink-50 text-ink-600'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
              )}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="hidden h-10 w-px bg-gray-100 lg:block" />

      {/* ── Messiness ──────────────────────────────────────────────────── */}
      <div className="flex min-w-[190px] flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Messiness
          </label>
          <span className="text-[11px] font-medium text-ink-600">
            {messinessLabel(messiness)}
            <span className="ml-1 text-gray-300">·</span>
            <span className="ml-1 tabular-nums text-gray-400">{messiness}</span>
          </span>
        </div>
        <input
          type="range"
          min={0} max={100} step={1}
          value={messiness}
          onChange={(e) => setMessiness(Number(e.target.value))}
          className="slider h-1.5 w-full cursor-pointer appearance-none rounded-full"
          style={{
            background: `linear-gradient(to right, #7c3aed ${messiness}%, #e5e7eb ${messiness}%)`,
          }}
        />
        <div className="flex justify-between text-[9px] text-gray-300">
          <span>Precise</span>
          <span>Wild</span>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEditor }             from '@/hooks/useEditor'
import { FONTS }                  from '@/lib/fonts'
import { FONT_SIZE_MIN, FONT_SIZE_MAX } from '@/lib/store'
import type { PaperSize }         from '@/lib/paperEngine'
import { clsx }                   from 'clsx'

const PAPER_OPTIONS: { value: PaperSize; label: string }[] = [
  { value: 'a4',     label: 'A4'  },
  { value: 'letter', label: '8.5"' },
  { value: 'a5',     label: 'A5'  },
]

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

function blurLabel(v: number) {
  if (v === 0)   return 'Sharp'
  if (v < 0.5)   return 'Natural'
  if (v < 1.2)   return 'Soft'
  return 'Dreamy'
}

const STEP = 8

export function Controls() {
  const {
    fontStyle, fontSize, inkColor, messiness, inkBlur, pageStyle, paperSize,
    textOffsetX, textOffsetY,
    setFontStyle, setFontSize, setInkColor, setMessiness, setInkBlur, setPageStyle, setPaperSize,
    setTextOffsetX, setTextOffsetY, resetTextOffset,
  } = useEditor()

  function shift(dx: number, dy: number) {
    setTextOffsetX(textOffsetX + dx)
    setTextOffsetY(textOffsetY + dy)
  }

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
              <span className="text-base leading-none" style={{ fontFamily: family }}>Aa</span>
              <span className="text-[9px] tracking-wide">{label}</span>
            </button>
          ))}
        </div>
      </div>

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
          >−</button>
          <span className="w-10 text-center text-[13px] font-semibold tabular-nums text-gray-700">
            {fontSize}
          </span>
          <button suppressHydrationWarning
            onClick={() => setFontSize(fontSize + 1)}
            disabled={fontSize >= FONT_SIZE_MAX}
            aria-label="Increase font size"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-sm text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-30"
          >+</button>
        </div>
      </div>

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
              style={{ backgroundColor: INK_PRESETS.some(p => p.color === inkColor) ? 'transparent' : inkColor }}
              title="Custom color"
            >
              <input
                type="color"
                value={inkColor}
                onChange={(e) => setInkColor(e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
            {!INK_PRESETS.some(p => p.color === inkColor) && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[8px] text-white">✦</span>
            )}
          </div>
        </div>
      </div>

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

      <div className="hidden h-10 w-px bg-gray-100 lg:block" />

      {/* ── Paper size ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Paper
        </label>
        <div className="flex items-center rounded-md border border-gray-200 text-[11px]">
          {PAPER_OPTIONS.map(({ value, label }, i) => (
            <button suppressHydrationWarning
              key={value}
              onClick={() => setPaperSize(value)}
              className={clsx(
                'px-2.5 py-1 transition-colors',
                i === 0 ? 'rounded-l-md' : i === PAPER_OPTIONS.length - 1 ? 'rounded-r-md border-l border-gray-200' : 'border-l border-gray-200',
                paperSize === value
                  ? 'bg-ink-50 text-ink-600'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="hidden h-10 w-px bg-gray-100 lg:block" />

      {/* ── Messiness ──────────────────────────────────────────────────── */}
      <div className="flex min-w-[160px] flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Messiness</label>
          <span className="text-[11px] font-medium text-ink-600">
            {messinessLabel(messiness)}
            <span className="ml-1 text-gray-300">·</span>
            <span className="ml-1 tabular-nums text-gray-400">{messiness}</span>
          </span>
        </div>
        <input
          type="range" min={0} max={100} step={1} value={messiness}
          onChange={(e) => setMessiness(Number(e.target.value))}
          className="slider h-1.5 w-full cursor-pointer appearance-none rounded-full"
          style={{ background: `linear-gradient(to right, #7c3aed ${messiness}%, #e5e7eb ${messiness}%)` }}
        />
        <div className="flex justify-between text-[9px] text-gray-300">
          <span>Precise</span><span>Wild</span>
        </div>
      </div>

      <div className="hidden h-10 w-px bg-gray-100 lg:block" />

      {/* ── Blur ───────────────────────────────────────────────────────── */}
      <div className="flex min-w-[140px] flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Blur</label>
          <span className="text-[11px] font-medium text-ink-600">
            {blurLabel(inkBlur)}
            <span className="ml-1 text-gray-300">·</span>
            <span className="ml-1 tabular-nums text-gray-400">{inkBlur.toFixed(1)}</span>
          </span>
        </div>
        <input
          type="range" min={0} max={2} step={0.1} value={inkBlur}
          onChange={(e) => setInkBlur(Number(e.target.value))}
          className="slider h-1.5 w-full cursor-pointer appearance-none rounded-full"
          style={{ background: `linear-gradient(to right, #7c3aed ${inkBlur / 2 * 100}%, #e5e7eb ${inkBlur / 2 * 100}%)` }}
        />
        <div className="flex justify-between text-[9px] text-gray-300">
          <span>Sharp</span><span>Dreamy</span>
        </div>
      </div>

      <div className="hidden h-10 w-px bg-gray-100 lg:block" />

      {/* ── Position ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Position
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 24px)', gridTemplateRows: 'repeat(3, 24px)', gap: 2 }}>
          <div />
          <button suppressHydrationWarning aria-label="Shift text up"
            onClick={() => shift(0, -STEP)} disabled={textOffsetY <= -60}
            className="flex items-center justify-center rounded border border-gray-200 text-[11px] text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800 disabled:opacity-30"
          >↑</button>
          <div />
          <button suppressHydrationWarning aria-label="Shift text left"
            onClick={() => shift(-STEP, 0)} disabled={textOffsetX <= -60}
            className="flex items-center justify-center rounded border border-gray-200 text-[11px] text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800 disabled:opacity-30"
          >←</button>
          <button suppressHydrationWarning aria-label="Reset text position"
            onClick={resetTextOffset} title="Reset position"
            className={clsx(
              'flex items-center justify-center rounded border text-[9px] transition-colors',
              textOffsetX === 0 && textOffsetY === 0
                ? 'border-gray-100 text-gray-300'
                : 'border-ink-200 text-ink-500 hover:bg-ink-50'
            )}
          >⊙</button>
          <button suppressHydrationWarning aria-label="Shift text right"
            onClick={() => shift(STEP, 0)} disabled={textOffsetX >= 60}
            className="flex items-center justify-center rounded border border-gray-200 text-[11px] text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800 disabled:opacity-30"
          >→</button>
          <div />
          <button suppressHydrationWarning aria-label="Shift text down"
            onClick={() => shift(0, STEP)} disabled={textOffsetY >= 60}
            className="flex items-center justify-center rounded border border-gray-200 text-[11px] text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800 disabled:opacity-30"
          >↓</button>
          <div />
        </div>
      </div>
    </div>
  )
}

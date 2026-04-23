/**
 * lib/handwritingEngine.ts
 *
 * Simulates natural human handwriting by combining two computation passes:
 *
 *   PASS 1 — Local transforms (per-character, independent)
 *     Each character gets its own seeded RNG. Rotation, scale, opacity.
 *     Changing one character never shifts any other.
 *
 *   PASS 2 — Sequential context (stateful, forward pass)
 *     Baseline drift, clustering rhythm, space imperfection, line offsets.
 *     These are inherently path-dependent — the hand carries state.
 *     Uses a separate RNG stream seeded from a fixed root so the entire
 *     text always produces the same output for the same input.
 *
 * All randomness is deterministic. Same text + options = same output, always.
 */

import React from 'react'

// ─── Public types ─────────────────────────────────────────────────────────────

export interface HandwritingOptions {
  /** 0–100. Master amplitude control for all effects. Default: 30 */
  messiness?:  number
  /** CSS color string. Default: '#1a1a2e' */
  inkColor?:   string
  /** CSS font-family string. Default: serif */
  fontFamily?: string
  /** CSS font-size string. Default: '15px' */
  fontSize?:   string
  /** CSS line-height. Default: 1.9 */
  lineHeight?: string | number
  /** Global char index offset for this page slice. Default: 0 */
  charIndexOffset?: number
  /** Hex color of the paper surface — blends ink color slightly toward it. Default: none */
  paperColor?: string
  /** Base blur in px applied to the handwriting layer (synced with messiness). Default: 0.2 */
  blur?: number
  /** Active highlights — applied as background-color to matching character spans */
  highlights?: ReadonlyArray<{ start: number; end: number; color: string }>
  /** Active blur ranges */
  blurRanges?: ReadonlyArray<{ start: number; end: number; amount: number }>
  /** String offset of this page's text within the full document (from paginator.charOffset) */
  pageStringOffset?: number
  /** Simulate printed/scanned handwriting */
  printMode?: boolean
}

// ─── Internal types ───────────────────────────────────────────────────────────

/** Per-character local transform — fully independent, seeded by char index */
interface LocalTransform {
  rotate:     number   // deg   ±2.5 at full messiness
  scaleX:     number   // 0.975 – 1.025
  scaleY:     number   // 0.965 – 1.035
  opacity:    number   // 0.88 – 1.0
  microX:     number   // px  sub-pixel lateral micro-jitter
  microY:     number   // px  sub-pixel vertical micro-jitter
}

/** Sequential context — accumulated across all characters in order */
interface SeqContext {
  baselineY:    number  // px  total baseline displacement (wave + drift)
  letterGap:    number  // px  cluster-based extra letter-spacing
  spaceWidth:   number  // em  randomised word-space width
  lineOffsetX:  number  // px  horizontal nudge after a line break
  lineRotate:   number  // deg tiny line-level slope variance
}

type Token =
  | { kind: 'char';    value: string; charIdx: number; seqIdx: number }
  | { kind: 'space';   charIdx: number; seqIdx: number }
  | { kind: 'newline'; seqIdx: number }

// ─── Color utilities ──────────────────────────────────────────────────────────

function parseHexColor(hex: string): [number, number, number] | null {
  const s = hex.trim().replace(/^#/, '')
  if (s.length === 3) {
    return [parseInt(s[0]+s[0], 16), parseInt(s[1]+s[1], 16), parseInt(s[2]+s[2], 16)]
  }
  if (s.length === 6) {
    return [parseInt(s.slice(0,2), 16), parseInt(s.slice(2,4), 16), parseInt(s.slice(4,6), 16)]
  }
  return null
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b]
    .map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Sanitise inkColor for realistic handwriting:
 *   - Pure black (#000) → dark navy ink (#1a1a2e) — no laser-black strokes
 *   - Blend 7% toward paper colour so ink reads as sitting on the surface
 */
function resolveInkColor(inkColor: string, paperColor?: string): string {
  const rgb = parseHexColor(inkColor)
  if (!rgb) return inkColor

  let [r, g, b] = rgb
  if (r === 0 && g === 0 && b === 0) { r = 26; g = 26; b = 46 }

  if (paperColor) {
    const paper = parseHexColor(paperColor)
    if (paper) {
      const t = 0.07
      r = r + (paper[0] - r) * t
      g = g + (paper[1] - g) * t
      b = b + (paper[2] - b) * t
    }
  }

  return rgbToHex(r, g, b)
}

/**
 * CSS textShadow that simulates ink feathering into paper fibres.
 * Two-layer: tight core spread + soft outer bleed.
 */
function buildInkSpread(hexColor: string): string {
  const rgb = parseHexColor(hexColor)
  if (!rgb) return 'none'
  const [r, g, b] = rgb
  return `0 0 0.5px rgba(${r},${g},${b},0.28), 0 0 1.5px rgba(${r},${g},${b},0.10)`
}

function varyInkTone(hexColor: string, n: number): string {
  const rgb = parseHexColor(hexColor)
  if (!rgb) return hexColor
  const drift = (Math.sin(n * 0.37) * 0.5 + Math.cos(n * 0.19) * 0.5) * 8
  return rgbToHex(rgb[0] + drift, rgb[1] + drift * 0.6, rgb[2] + drift * 0.3)
}

function wordBlurVariance(wordIndex: number, messiness01: number): number {
  const wave = Math.sin(wordIndex * 0.63) * 0.5 + Math.cos(wordIndex * 0.21) * 0.5
  return Math.max(0, (wave + 1) * 0.5 * 0.12 * messiness01)
}

// ─── PRNG ─────────────────────────────────────────────────────────────────────

/**
 * mulberry32 — stateful, 32-bit, passes BigCrush.
 * Each call to next() advances the state and returns a float in [0, 1).
 */
function createRng(seed: number): () => number {
  let s = seed >>> 0
  return function next(): number {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000
  }
}

/** Knuth multiplicative hash — maps sequential indices to spread-out seeds */
function seedForIndex(i: number): number {
  return Math.imul(i + 1, 0x9e3779b9) >>> 0
}

/** Map rng() output from [0,1) to a signed range [-1, 1) */
function signed(rng: () => number): number {
  return rng() * 2 - 1
}

// ─── Pass 1: Local transforms ─────────────────────────────────────────────────

/**
 * Compute the character-local transforms.
 * Uses an independent RNG seeded only from charIdx — completely isolated.
 * Editing character N never affects character M.
 */
function computeLocal(charIdx: number, m: number): LocalTransform {
  const rng = createRng(seedForIndex(charIdx))
  const r   = () => signed(rng)

  return {
    rotate:  r() * 2.5  * m,
    scaleX:  1 + r() * 0.025 * m,
    scaleY:  1 + r() * 0.035 * m,
    opacity: 0.87 + rng() * 0.10,   // 0.87–0.97: natural ink is never fully opaque
    microX:  r() * 1.2  * m,
    microY:  r() * 1.8  * m,
  }
}

// ─── Pass 2: Sequential context ───────────────────────────────────────────────

/**
 * Cluster state machine.
 *
 * Real handwriting groups letters into rhythmic clusters — some run together,
 * some spread apart. The boundary between clusters shifts letter-spacing.
 *
 * Cluster sizes are 3–5 characters, randomly seeded per cluster boundary.
 */
interface ClusterState {
  pos:      number   // position within current cluster (0-based)
  size:     number   // current cluster length
  tight:    boolean  // current cluster is tight (letters closer) or loose
  rng:      () => number
}

function makeClusterState(): ClusterState {
  const rng = createRng(0xc1a5_5e42)
  return { pos: 0, size: Math.floor(rng() * 3) + 3, tight: true, rng }
}

function advanceCluster(cs: ClusterState, m: number): number {
  cs.pos++
  if (cs.pos >= cs.size) {
    cs.pos   = 0
    cs.size  = Math.floor(cs.rng() * 3) + 3   // next cluster: 3–5 chars
    cs.tight = !cs.tight                        // alternate tight/loose
  }
  // Tight clusters: slight negative gap. Loose: slight positive.
  // Amplitude grows with messiness. Hard ceiling so text stays readable.
  const base = cs.tight ? -0.4 : 0.6
  return base * m * 2   // px, scaled — max ±1.2px at full messiness
}

/**
 * Compute the sequential context for every token in one forward pass.
 *
 * Using a single advancing RNG stream means the output is path-dependent
 * (exactly like a real hand moving across paper), but still fully
 * deterministic for a given text string.
 */
function computeSequentialContexts(tokens: Token[], m: number): Map<number, SeqContext> {
  const out = new Map<number, SeqContext>()

  // ── Shared sequential RNG streams ──────────────────────────────────────
  // Each concern gets its own RNG so they don't steal entropy from each other.
  const driftRng   = createRng(0xd7_1f_a0_03)   // cumulative baseline drift
  const spaceRng   = createRng(0x5a_ce_b0_07)   // word-space width
  const lineRng    = createRng(0x1b_3e_44_f1)   // line break offsets

  const cluster    = makeClusterState()

  // ── Accumulated state ───────────────────────────────────────────────────
  let cumulativeDrift = 0   // random walk, px
  let lineOffsetX     = 0   // horizontal nudge for current line, px
  let lineBaselineY   = 0   // per-line baseline nudge, px
  let lineRotate      = signed(lineRng) * 0.10 * m
  let seqCounter      = 0   // counts all tokens for wave phase

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i]

    // ── Line break ──────────────────────────────────────────────────────
    if (tok.kind === 'newline') {
      // Each new line starts with a slightly different baseline and indent.
      lineOffsetX  = signed(lineRng) * 3  * m    // ±3px horizontal offset
      lineBaselineY = signed(lineRng) * 1  * m   // ±1px line baseline shift
      lineRotate    = signed(lineRng) * 0.18 * m // subtle line slope variation
      cumulativeDrift *= 0.4                      // drift partially resets at newline
      out.set(tok.seqIdx, {
        baselineY:   0,
        letterGap:   0,
        spaceWidth:  0,
        lineOffsetX: lineOffsetX,
        lineRotate,
      })
      continue
    }

    // ── Space ────────────────────────────────────────────────────────────
    if (tok.kind === 'space') {
      // Base word gap = 0.3em; add random ±variation
      // Positive bias (+0.05) because tight spaces read worse than loose ones
      const variation = (spaceRng() * 0.09 - 0.02) * m   // −0.02em to +0.07em
      out.set(tok.seqIdx, {
        baselineY:   0,
        letterGap:   0,
        spaceWidth:  0.3 + variation,
        lineOffsetX: 0,
        lineRotate,
      })
      seqCounter++
      continue
    }

    // ── Printable character ──────────────────────────────────────────────

    // Baseline wave — sinusoidal, slow period
    const wave = Math.sin(seqCounter * 0.18) * 1.8 * m

    // Cumulative drift — bounded random walk so text doesn't run off-screen
    cumulativeDrift += signed(driftRng) * 0.08 * m
    cumulativeDrift  = Math.max(-3 * m, Math.min(3 * m, cumulativeDrift))

    // Total Y: wave + drift + per-line nudge
    const baselineY = wave + cumulativeDrift + lineBaselineY

    // Cluster letter-spacing
    const letterGap = advanceCluster(cluster, m)

    out.set(tok.seqIdx, {
      baselineY,
      letterGap,
      spaceWidth:  0,
      lineOffsetX: lineOffsetX,
      lineRotate,
    })

    seqCounter++
  }

  return out
}

// ─── Tokeniser ────────────────────────────────────────────────────────────────

/**
 * Split text into tokens with two separate counters:
 *   charIdx  — indexes printable chars only, used to seed local transforms
 *   seqIdx   — indexes every token, used as key into sequential context map
 */
function tokenise(text: string): Token[] {
  const tokens: Token[] = []
  let charIdx = 0
  let seqIdx  = 0

  for (const ch of text) {
    if (ch === '\n') {
      tokens.push({ kind: 'newline', seqIdx: seqIdx++ })
    } else if (ch === ' ' || ch === '\t') {
      tokens.push({ kind: 'space', charIdx: charIdx++, seqIdx: seqIdx++ })
    } else {
      tokens.push({ kind: 'char', value: ch, charIdx: charIdx++, seqIdx: seqIdx++ })
    }
  }

  return tokens
}

// ─── CSS helpers ─────────────────────────────────────────────────────────────

function buildTransform(local: LocalTransform, seq: SeqContext): string {
  const x = local.microX + seq.lineOffsetX
  const y = local.microY + seq.baselineY
  const rot = local.rotate + seq.lineRotate
  return [
    `translate(${x.toFixed(3)}px, ${y.toFixed(3)}px)`,
    `rotate(${rot.toFixed(3)}deg)`,
    `scale(${local.scaleX.toFixed(4)}, ${local.scaleY.toFixed(4)})`,
  ].join(' ')
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Render `text` as an array of React nodes with natural handwriting transforms.
 *
 * Wrap the call in useMemo — the function is pure but not free:
 *
 *   const nodes = useMemo(
 *     () => renderHandwriting(text, { messiness, inkColor, fontFamily }),
 *     [text, messiness, inkColor, fontFamily]
 *   )
 */
export function renderHandwriting(
  text:    string,
  options: HandwritingOptions = {}
): React.ReactNode[] {
  const {
    messiness        = 30,
    inkColor         = '#1a1a2e',
    fontFamily       = 'serif',
    fontSize         = '15px',
    lineHeight       = 1.9,
    charIndexOffset  = 0,
    paperColor,
    highlights,
    blurRanges,
    pageStringOffset = 0,
    printMode = false,
  } = options

  if (!text) return []

  const resolvedColor = resolveInkColor(inkColor, paperColor)
  const inkSpread     = buildInkSpread(resolvedColor)

  const m      = Math.max(0, Math.min(100, messiness)) / 100
  const tokens = tokenise(text)
  const seqCtx = computeSequentialContexts(tokens, m)
  const nodes: React.ReactNode[] = []
  let wordIndex = 0

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i]
    const ctx = seqCtx.get(tok.seqIdx)!

    // ── Newline → <br> ─────────────────────────────────────────────────────
    if (tok.kind === 'newline') {
      wordIndex++
      nodes.push(React.createElement('br', { key: `br-${tok.seqIdx}` }))
      continue
    }

    // ── Space → width-variable non-collapsing span ─────────────────────────
    if (tok.kind === 'space') {
      wordIndex++
      const gPos      = pageStringOffset + tok.seqIdx
      const hlSpace   = highlights?.find((h) => gPos >= h.start && gPos < h.end)
      nodes.push(
        React.createElement('span', {
          key:   `sp-${tok.seqIdx}`,
          style: {
            display:         'inline-block',
            position:        'relative' as const,
            width:           `${ctx.spaceWidth.toFixed(4)}em`,
            minWidth:        '0.15em',
            fontFamily,
            fontSize,
            backgroundColor: hlSpace?.color,
          },
        }, '\u00A0')
      )
      continue
    }

    // ── Printable character ────────────────────────────────────────────────
    const gPos   = pageStringOffset + tok.seqIdx
    const hl     = highlights?.find((h) => gPos >= h.start && gPos < h.end)
    const blurMark = blurRanges?.find((r) => gPos >= r.start && gPos < r.end)
    const local  = computeLocal(tok.charIdx + charIndexOffset, m)
    const dynamicInkColor = varyInkTone(resolvedColor, tok.seqIdx)
    const naturalWordBlur = wordBlurVariance(wordIndex, m)
    const effectiveColor = printMode ? resolveInkColor(dynamicInkColor, '#b8b6b0') : dynamicInkColor

    const style: React.CSSProperties = {
      display:         'inline-block',
      position:        'relative',
      fontFamily,
      fontSize,
      lineHeight,
      color:           effectiveColor,
      transform:       buildTransform(local, ctx),
      opacity:         printMode ? Math.max(0.74, local.opacity - 0.10) : local.opacity,
      textShadow:      hl ? 'none' : inkSpread,   // skip spread under highlight
      marginRight:     `${ctx.letterGap.toFixed(3)}px`,
      transition:      'color 0.25s ease, opacity 0.25s ease',
      backgroundColor: hl?.color,
      borderRadius:    hl ? '1px' : undefined,
      filter:          blurMark
        ? `blur(${blurMark.amount.toFixed(2)}px)`
        : (naturalWordBlur > 0 ? `blur(${(naturalWordBlur + (printMode ? 0.06 : 0)).toFixed(2)}px)` : (printMode ? 'blur(0.05px)' : undefined)),
      fontVariantLigatures: 'none' as const,
    }

    nodes.push(
      React.createElement(
        'span',
        { key: `ch-${tok.seqIdx}-${tok.value}`, style },
        tok.value
      )
    )
  }

  return nodes
}

// ─── Warm-up ──────────────────────────────────────────────────────────────────

/**
 * Exercise the hot computation paths so V8 JITs them before the first
 * real render. Call once at module load / app init.
 */
export function prewarmEngine(charCount = 500): void {
  const dummy = 'x'.repeat(charCount)
  renderHandwriting(dummy, { messiness: 50 })
}

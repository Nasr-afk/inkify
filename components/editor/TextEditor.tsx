'use client'

import { useEditor }  from '@/hooks/useEditor'
import { getFontDef } from '@/lib/fonts'

export function TextEditor() {
  const { text, fontStyle, fontSize, inkColor, setText } = useEditor()
  const fontDef  = getFontDef(fontStyle)
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  // iOS Safari zooms in when an input/textarea has font-size < 16px.
  // We clamp the rendered font size to 16px minimum so iOS never auto-zooms,
  // while the store value (used by the preview engine) can be as small as 12px.
  const renderedFontSize = Math.max(16, fontSize)

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-ink-500" />
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Editor
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-300">
          <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
          <span className="text-gray-200">·</span>
          <span className="tabular-nums">{text.length} chars</span>
        </div>
      </div>

      {/* Textarea */}
      <div className="relative flex-1 overflow-hidden">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start typing your text..."
          spellCheck={false}
          // autocomplete off prevents browser UI from overlapping the field on mobile
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="sentences"
          className="
            h-full w-full resize-none bg-transparent
            px-5 py-4 leading-relaxed
            placeholder:text-gray-300
            focus:outline-none scrollbar-thin
          "
          style={{
            fontFamily: fontDef.family,
            fontSize:   `${renderedFontSize}px`,
            lineHeight: 1.75,
            color:      inkColor,
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" />
      </div>
    </div>
  )
}

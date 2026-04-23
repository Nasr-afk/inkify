'use client'

import type { ReactNode, RefObject, MutableRefObject } from 'react'

const SHIFT_STEP = 8

export interface TextLayerProps {
  nodes:           ReactNode[]
  isFirstPage:     boolean
  editable:        boolean
  rawText?:        string
  inkColor:        string
  fontSize:        string | number
  effectiveBlur:   number
  noiseId:         string
  textOffsetX:     number
  textOffsetY:     number
  mT:              number
  mL:              number
  mR:              number
  mB:              number
  editableRef?:    RefObject<HTMLDivElement>
  isComposingRef?: MutableRefObject<boolean>
  onTextChange?:   (text: string) => void
  onShift?:        (dx: number, dy: number) => void
  onSelectionChange?: () => void
  onClearToolbar?:    () => void
}

export function TextLayer({
  nodes, isFirstPage, editable, rawText, inkColor, fontSize, effectiveBlur, noiseId,
  textOffsetX, textOffsetY, mT, mL, mR, mB,
  editableRef, isComposingRef, onTextChange, onShift, onSelectionChange, onClearToolbar,
}: TextLayerProps) {
  const fontSizeStr = typeof fontSize === 'string' ? fontSize : `${fontSize}px`

  return (
    <div
      style={{
        position:   'absolute',
        top:        mT,
        left:       mL,
        right:      mR,
        bottom:     mB,
        overflow:   'hidden',
        transform:  `translate(${textOffsetX}px, ${textOffsetY}px)`,
        transition: 'transform 0.15s ease',
      }}
    >
      {/* ── Handwriting render ────────────────────────────────────────────── */}
      {nodes.length > 0 ? (
        <div
          className="break-words"
          style={{
            lineHeight:    1.9,
            color:         inkColor,
            opacity:       0.92,
            filter:        `url(#${noiseId}) blur(${effectiveBlur.toFixed(3)}px)`,
            transition:    'filter 0.2s ease',
            pointerEvents: editable ? 'none' : undefined,
          }}
        >
          {nodes}
        </div>
      ) : (
        !editable && isFirstPage && (
          <div
            style={{
              height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
              userSelect: 'none', pointerEvents: 'none',
            }}
          >
            <span style={{ fontSize: 28, opacity: 0.15 }}>✦</span>
            <p style={{ fontSize: 13, color: '#d1d5db' }}>Start typing to see your handwriting</p>
          </div>
        )
      )}

      {/* ── Editable overlay (page 0 only) ────────────────────────────────── */}
      {editable && (
        <>
          {!rawText && (
            <div
              aria-hidden
              style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 12,
                userSelect: 'none', pointerEvents: 'none',
              }}
            >
              <span style={{ fontSize: 28, opacity: 0.15 }}>✦</span>
              <p style={{ fontSize: 13, color: '#d1d5db' }}>Click here and start typing…</p>
            </div>
          )}

          <div
            ref={editableRef}
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            onCompositionStart={() => { if (isComposingRef) isComposingRef.current = true }}
            onCompositionEnd={(e) => {
              if (isComposingRef) isComposingRef.current = false
              onTextChange?.(e.currentTarget.innerText)
            }}
            onMouseUp={onSelectionChange}
            onKeyUp={onSelectionChange}
            onKeyDown={(e) => {
              if (!e.altKey) return
              const map: Record<string, [number, number]> = {
                ArrowUp:    [0, -SHIFT_STEP],
                ArrowDown:  [0, +SHIFT_STEP],
                ArrowLeft:  [-SHIFT_STEP, 0],
                ArrowRight: [+SHIFT_STEP, 0],
              }
              const delta = map[e.key]
              if (!delta) return
              e.preventDefault()
              onShift?.(delta[0], delta[1])
            }}
            onInput={(e) => {
              onClearToolbar?.()
              if (isComposingRef?.current) return
              onTextChange?.(e.currentTarget.innerText)
            }}
            onPaste={(e) => {
              e.preventDefault()
              const plain = e.clipboardData.getData('text/plain')
              const sel = window.getSelection()
              if (!sel?.rangeCount) return
              const range = sel.getRangeAt(0)
              range.deleteContents()
              const node = document.createTextNode(plain)
              range.insertNode(node)
              range.setStartAfter(node)
              range.collapse(true)
              sel.removeAllRanges()
              sel.addRange(range)
              onTextChange?.(e.currentTarget.innerText)
            }}
            style={{
              position:   'absolute',
              inset:      0,
              color:      'transparent',
              caretColor: inkColor,
              lineHeight: 1.9,
              fontSize:   fontSizeStr,
              whiteSpace: 'pre-wrap',
              wordBreak:  'break-word',
              outline:    'none',
              cursor:     'text',
              overflowY:  'hidden',
            }}
          />
        </>
      )}
    </div>
  )
}

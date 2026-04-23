'use client'

import { useState, useEffect }  from 'react'
import type { RefObject }        from 'react'
import type { Highlight, BlurRange }        from '@/lib/store'

export type ToolbarPos = { top: number; left: number; start: number; end: number }

interface UseSelectionOptions {
  editableRef:        RefObject<HTMLDivElement>
  pageRef:            RefObject<HTMLDivElement>
  highlights?:        Highlight[]
  blurRanges?:        BlurRange[]
  onAddHighlight?:    (start: number, end: number, color: string) => void
  onRemoveHighlight?: (id: string) => void
  onAddBlur?:         (start: number, end: number, amount: number) => void
  onRemoveBlur?:      (id: string) => void
}

export function useSelection({
  editableRef,
  pageRef,
  highlights,
  blurRanges,
  onAddHighlight,
  onRemoveHighlight,
  onAddBlur,
  onRemoveBlur,
}: UseSelectionOptions) {
  const [toolbarPos, setToolbarPos] = useState<ToolbarPos | null>(null)

  // Dismiss toolbar when clicking outside it
  useEffect(() => {
    if (!toolbarPos) return
    function onDown(e: MouseEvent) {
      const toolbar = pageRef.current?.querySelector('[role="toolbar"]')
      if (!toolbar?.contains(e.target as Node)) setToolbarPos(null)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [toolbarPos, pageRef])

  function handleSelectionChange() {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.rangeCount) { setToolbarPos(null); return }
    const el   = editableRef.current
    const page = pageRef.current
    if (!el || !page) return
    const range = sel.getRangeAt(0)
    if (!el.contains(range.commonAncestorContainer)) { setToolbarPos(null); return }

    const before = range.cloneRange()
    before.selectNodeContents(el)
    before.setEnd(range.startContainer, range.startOffset)
    const start = before.toString().length

    const beforeEnd = range.cloneRange()
    beforeEnd.selectNodeContents(el)
    beforeEnd.setEnd(range.endContainer, range.endOffset)
    const end = beforeEnd.toString().length

    if (start === end) { setToolbarPos(null); return }

    const selRect  = range.getBoundingClientRect()
    const pageRect = page.getBoundingClientRect()
    setToolbarPos({
      top:   selRect.top  - pageRect.top  - 44,
      left:  selRect.left - pageRect.left + selRect.width / 2,
      start,
      end,
    })
  }

  function handleAddHighlight(color: string) {
    if (!toolbarPos) return
    onAddHighlight?.(toolbarPos.start, toolbarPos.end, color)
    window.getSelection()?.removeAllRanges()
    setToolbarPos(null)
  }

  function handleClearHighlight() {
    if (!toolbarPos || !highlights) return
    const { start, end } = toolbarPos
    highlights
      .filter((h) => h.start < end && h.end > start)
      .forEach((h) => onRemoveHighlight?.(h.id))
    window.getSelection()?.removeAllRanges()
    setToolbarPos(null)
  }

  function handleAddBlur(amount = 1) {
    if (!toolbarPos) return
    onAddBlur?.(toolbarPos.start, toolbarPos.end, amount)
    window.getSelection()?.removeAllRanges()
    setToolbarPos(null)
  }

  function handleClearBlur() {
    if (!toolbarPos || !blurRanges) return
    const { start, end } = toolbarPos
    blurRanges
      .filter((r) => r.start < end && r.end > start)
      .forEach((r) => onRemoveBlur?.(r.id))
    window.getSelection()?.removeAllRanges()
    setToolbarPos(null)
  }

  return { toolbarPos, setToolbarPos, handleSelectionChange, handleAddHighlight, handleClearHighlight, handleAddBlur, handleClearBlur }
}

'use client'

import { useCanvasStore } from '@/lib/store'
import type { CanvasElement } from '@/lib/store'
import { generateId, clamp } from '@/lib/utils'

const ZOOM_MIN = 0.1
const ZOOM_MAX = 4

/**
 * Thin wrapper around useCanvasStore.
 * Adds compound actions (addShape, deleteSelected, zoom helpers) that
 * would be awkward to put in a flat Zustand store.
 */
export function useCanvas() {
  const { elements, selectedId, zoom,
          addElement, removeElement, selectElement, setZoom } = useCanvasStore()

  const selectedElement = elements.find((el) => el.id === selectedId) ?? null

  function addShape(type: CanvasElement['type']) {
    addElement({
      id:     generateId(),
      type,
      x:      100,
      y:      100,
      width:  120,
      height: type === 'text' ? 40 : 120,
      label:  type === 'text' ? 'Text' : undefined,
    })
  }

  function deleteSelected() {
    if (selectedId) {
      removeElement(selectedId)
      selectElement(null)
    }
  }

  function zoomIn()    { setZoom(clamp(zoom + 0.1, ZOOM_MIN, ZOOM_MAX)) }
  function zoomOut()   { setZoom(clamp(zoom - 0.1, ZOOM_MIN, ZOOM_MAX)) }
  function zoomReset() { setZoom(1) }

  return {
    elements,
    selectedId,
    selectedElement,
    zoom,
    addShape,
    deleteSelected,
    selectElement,
    zoomIn,
    zoomOut,
    zoomReset,
  }
}

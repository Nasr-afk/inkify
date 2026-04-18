import { create } from 'zustand'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CanvasElement {
  id:      string
  type:    'rect' | 'circle' | 'text' | 'image' | 'line'
  x:       number
  y:       number
  width:   number
  height:  number
  label?:  string
}

interface CanvasState {
  // ── State ────────────────────────────────────────────────────────────────
  elements:   CanvasElement[]
  selectedId: string | null
  zoom:       number

  // ── Actions ──────────────────────────────────────────────────────────────
  addElement:    (element:  CanvasElement)  => void
  removeElement: (targetId: string)         => void
  selectElement: (targetId: string | null)  => void
  setZoom:       (level:    number)         => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCanvasStore = create<CanvasState>((set) => ({
  elements:   [],
  selectedId: null,
  zoom:       1,

  addElement:    (element)  => set((s) => ({ elements: [...s.elements, element] })),
  removeElement: (targetId) => set((s) => ({ elements: s.elements.filter((e) => e.id !== targetId) })),
  selectElement: (id)       => set({ selectedId: id }),
  setZoom:       (level)    => set({ zoom: level }),
}))

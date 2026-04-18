/**
 * lib/store/index.ts
 *
 * Single entry point for all Zustand stores.
 * Import stores from here — never from individual store files directly.
 *
 *   import { useInkifyStore } from '@/lib/store'
 *   import { useCanvasStore } from '@/lib/store'
 */

export { useInkifyStore, FONT_SIZE_MIN, FONT_SIZE_MAX, FONT_SIZE_DEFAULT } from './useInkifyStore'
export type { InkifyState, FontStyle }  from './useInkifyStore'

export { useCanvasStore }               from './useCanvasStore'
export type { CanvasElement }           from './useCanvasStore'

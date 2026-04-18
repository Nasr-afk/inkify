import { clsx, type ClassValue } from 'clsx'
import { nanoid } from 'nanoid'

/** Merge Tailwind class names safely */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

/** Generate a short unique ID for canvas elements */
export function generateId(): string {
  return nanoid(8)
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Round to N decimal places */
export function round(value: number, decimals = 2): number {
  return Math.round(value * 10 ** decimals) / 10 ** decimals
}

/** Convert px to a display string */
export function px(value: number): string {
  return `${value}px`
}

/** Format zoom level as a percentage string */
export function formatZoom(zoom: number): string {
  return `${Math.round(zoom * 100)}%`
}

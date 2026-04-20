import { nanoid } from 'nanoid'

/** Generate a short unique ID */
export function generateId(): string {
  return nanoid(8)
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

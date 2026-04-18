'use client'

import { useState, useEffect, useRef } from 'react'

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms
 * of silence, plus an `isPending` flag that is true while the value is
 * waiting to settle.
 *
 * Generic — works for strings, numbers, objects, anything.
 *
 * Design note: `isPending` is derived from comparing `value` to the
 * debounced copy — no extra state, no race conditions.
 */
export function useDebounce<T>(value: T, delay: number): { debounced: T; isPending: boolean } {
  const [debounced, setDebounced] = useState<T>(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Clear any in-flight timer so only the latest value wins
    if (timerRef.current !== null) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      setDebounced(value)
      timerRef.current = null
    }, delay)

    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    }
  }, [value, delay])

  return {
    debounced,
    isPending: value !== debounced,
  }
}

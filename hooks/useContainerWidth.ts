'use client'

import { useState, useEffect, useRef } from 'react'

/**
 * Returns the current pixel width of a container element,
 * updating reactively whenever it resizes.
 *
 * Returns 0 until the ref is attached and the first measurement fires.
 */
export function useContainerWidth(): [React.RefObject<HTMLDivElement>, number] {
  const ref   = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Initial measurement
    setWidth(el.getBoundingClientRect().width)

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setWidth(entry.contentRect.width)
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, width]
}

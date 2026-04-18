'use client'

import { useEffect } from 'react'

type KeyMap = Record<string, (e: KeyboardEvent) => void>

/**
 * Bind keyboard shortcuts globally.
 * Keys are matched as `event.key` (case-sensitive).
 * Modifier combos use the pattern "Meta+z", "Ctrl+z", "Shift+Delete", etc.
 */
export function useKeyboard(keyMap: KeyMap) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const parts: string[] = []
      if (e.metaKey)  parts.push('Meta')
      if (e.ctrlKey)  parts.push('Ctrl')
      if (e.shiftKey) parts.push('Shift')
      if (e.altKey)   parts.push('Alt')
      parts.push(e.key)

      const combo = parts.join('+')
      const handler = keyMap[combo] ?? keyMap[e.key]
      if (handler) {
        e.preventDefault()
        handler(e)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [keyMap])
}

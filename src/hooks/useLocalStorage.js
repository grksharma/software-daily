import { useCallback, useEffect, useState } from 'react'

/**
 * State that survives a reload.
 *
 * Reads are lazy and guarded: private-browsing modes and storage quotas can
 * make localStorage throw on both read and write, and a reading list is never
 * worth breaking the page over — so every access falls back to in-memory state.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key)
      return stored === null ? initialValue : JSON.parse(stored)
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage unavailable or full — keep the in-memory value and move on.
    }
  }, [key, value])

  // Keep multiple open tabs consistent with each other.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== key || event.newValue === null) return
      try {
        setValue(JSON.parse(event.newValue))
      } catch {
        // Ignore values this app didn't write.
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])

  const reset = useCallback(() => setValue(initialValue), [initialValue])

  return [value, setValue, reset]
}

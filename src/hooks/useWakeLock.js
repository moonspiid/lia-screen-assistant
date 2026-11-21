import { useEffect, useRef } from 'react'

// Keeps the phone screen awake while Lia is talking. Without it, Android turns
// the screen off after a few seconds and suspends the page (and the microphone).
export function useWakeLock(active) {
  const lockRef = useRef(null)

  useEffect(() => {
    if (!active) return
    let cancelled = false

    const request = async () => {
      if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return
      if (lockRef.current) return
      try {
        const lock = await navigator.wakeLock.request('screen')
        if (cancelled) {
          lock.release().catch(() => {})
          return
        }
        lockRef.current = lock
        lock.addEventListener('release', () => {
          lockRef.current = null
        })
      } catch {
        // Refused (battery saver, unsupported browser): the conversation still
        // works, only the screen is allowed to sleep.
      }
    }

    request()
    const onVisible = () => {
      if (document.visibilityState === 'visible') request()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      const lock = lockRef.current
      lockRef.current = null
      if (lock) {
        try {
          lock.release().catch(() => {})
        } catch {
          // already released
        }
      }
    }
  }, [active])
}

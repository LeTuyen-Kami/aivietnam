'use client'

import { useCallback, useEffect, useState, type RefObject } from 'react'

export function useLiveImmersiveMode(containerRef: RefObject<HTMLElement | null>) {
  const [immersive, setImmersive] = useState(false)

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setImmersive(false)
      }
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  useEffect(() => {
    if (immersive && !document.fullscreenElement) {
      document.body.classList.add('live-immersive')
      return () => {
        document.body.classList.remove('live-immersive')
      }
    }
    document.body.classList.remove('live-immersive')
    return undefined
  }, [immersive])

  const toggle = useCallback(async () => {
    const el = containerRef.current
    if (!el) return

    if (document.fullscreenElement === el) {
      await document.exitFullscreen().catch(() => null)
      setImmersive(false)
      return
    }

    if (immersive) {
      setImmersive(false)
      return
    }

    if (document.fullscreenEnabled) {
      try {
        await el.requestFullscreen()
        setImmersive(true)
        return
      } catch {
        // Fall through to CSS immersive mode
      }
    }

    setImmersive(true)
  }, [containerRef, immersive])

  return { immersive, toggle }
}

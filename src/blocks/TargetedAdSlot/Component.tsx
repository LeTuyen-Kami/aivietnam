'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import type { TargetedAdSlotBlock } from '@/payload-types'

import { PortalMobileAdSlot } from '@/blocks/TargetedAdSlot/PortalMobileAdSlot'

const RESOLVE_TIMEOUT_MS = 20_000

export const TargetedAdSlotBlockComponent: React.FC<TargetedAdSlotBlock> = ({
  targetElementId,
  embedCss,
  embedHtml,
  embedScript,
}) => {
  const [mountEl, setMountEl] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const id = targetElementId?.trim() ?? ''
    if (!id) {
      setMountEl(null)
      return
    }

    const tryResolve = () => {
      const el = document.getElementById(id)
      return el instanceof HTMLElement ? el : null
    }

    const found = tryResolve()
    if (found) {
      setMountEl(found)
      return
    }

    setMountEl(null)

    const observer = new MutationObserver(() => {
      const el = tryResolve()
      if (el) {
        setMountEl(el)
        observer.disconnect()
        window.clearTimeout(timeoutId)
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })

    const timeoutId = window.setTimeout(() => {
      observer.disconnect()
    }, RESOLVE_TIMEOUT_MS)

    return () => {
      observer.disconnect()
      window.clearTimeout(timeoutId)
    }
  }, [targetElementId])

  if (!mountEl) {
    return null
  }

  return createPortal(
    <PortalMobileAdSlot css={embedCss} html={embedHtml} mobileOnly={false} script={embedScript} />,
    mountEl,
  )
}

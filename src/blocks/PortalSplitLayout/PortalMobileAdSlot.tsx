'use client'

import React, { useEffect, useRef } from 'react'

import { cn } from '@/utilities/ui'

type InjectRoot = HTMLElement | ShadowRoot

function appendScriptsFromString(container: InjectRoot, source: string) {
  const trimmed = source.trim()
  if (!trimmed) return

  if (/<script/i.test(trimmed)) {
    const doc = new DOMParser().parseFromString(trimmed, 'text/html')
    doc.querySelectorAll('script').forEach((node) => {
      const el = document.createElement('script')
      for (const attr of node.attributes) {
        el.setAttribute(attr.name, attr.value)
      }
      el.textContent = node.textContent
      container.appendChild(el)
    })
    return
  }

  const el = document.createElement('script')
  el.textContent = trimmed
  container.appendChild(el)
}

/** Base rules inside shadow: layout + box model; inherited color/font still come from the page host. */
const SHADOW_BASE_STYLE = `:host {
  display: block;
  box-sizing: border-box;
}
*, *::before, *::after {
  box-sizing: border-box;
}
`

export const PortalMobileAdSlot: React.FC<{
  className?: string
  css?: string | null
  html?: string | null
  script?: string | null
}> = ({ className, css, html, script }) => {
  const rootRef = useRef<HTMLDivElement>(null)

  const hasContent = Boolean(html?.trim() || css?.trim() || script?.trim())

  useEffect(() => {
    const host = rootRef.current
    if (!host) return

    const cssRaw = css?.trim() ?? ''
    const htmlRaw = html?.trim() ?? ''
    const scriptRaw = script?.trim() ?? ''
    if (!cssRaw && !htmlRaw && !scriptRaw) {
      host.shadowRoot?.replaceChildren()
      return
    }

    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' })
    shadow.replaceChildren()

    const base = document.createElement('style')
    base.textContent = SHADOW_BASE_STYLE
    shadow.appendChild(base)

    if (cssRaw) {
      if (/<style/i.test(cssRaw)) {
        const doc = new DOMParser().parseFromString(cssRaw, 'text/html')
        doc.querySelectorAll('style').forEach((style) => {
          shadow.appendChild(style.cloneNode(true))
        })
      } else {
        const style = document.createElement('style')
        style.textContent = cssRaw
        shadow.appendChild(style)
      }
    }

    if (htmlRaw) {
      const slot = document.createElement('div')
      slot.className = 'portal-mobile-ad-markup'
      slot.innerHTML = htmlRaw
      shadow.appendChild(slot)
    }

    if (scriptRaw) {
      appendScriptsFromString(shadow, scriptRaw)
    }

    return () => {
      shadow.replaceChildren()
    }
  }, [css, html, script])

  if (!hasContent) {
    return null
  }

  return (
    <div
      className={cn('isolate min-w-0 overflow-hidden lg:hidden', className)}
      ref={rootRef}
      suppressHydrationWarning
    />
  )
}

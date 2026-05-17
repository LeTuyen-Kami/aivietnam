'use client'

import React, { useEffect, useRef } from 'react'

import { cn } from '@/utilities/ui'

function appendScriptsFromString(container: HTMLElement, source: string) {
  const trimmed = source.trim()
  if (!trimmed) return

  if (/<script/i.test(trimmed)) {
    const parsed = new DOMParser().parseFromString(trimmed, 'text/html')
    parsed.querySelectorAll('script').forEach((node) => {
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

/** Scoped to the slot root so embed CSS does not need :host. */
const LIGHT_SCOPED_RESET = `.portal-mobile-ad-slot-root{display:block;min-width:0;box-sizing:border-box}.portal-mobile-ad-slot-root,.portal-mobile-ad-slot-root::before,.portal-mobile-ad-slot-root::after,.portal-mobile-ad-slot-root *,.portal-mobile-ad-slot-root *::before,.portal-mobile-ad-slot-root *::after{box-sizing:border-box}`

/** Avoid premature `</script>` when embedding strings into a full HTML document. */
function escapeClosingStyleTag(s: string) {
  return s.replace(/<\/style/gi, '<\\/style')
}

function escapeClosingScriptTag(s: string) {
  return s.replace(/<\/script/gi, '<\\/script')
}

function scriptElementToSrcDocString(node: Element): string {
  const attrs = [...node.attributes]
    .map((a) => ` ${a.name}="${String(a.value).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`)
    .join('')
  const text = escapeClosingScriptTag(node.textContent ?? '')
  return `<script${attrs}>${text}<\/script>`
}

/** Full mini-document so third-party code runs against `iframe.contentDocument`, not the host `document`. */
function buildIframeSrcDoc(cssRaw: string, htmlRaw: string, scriptRaw: string): string {
  let headStyles = ''
  if (cssRaw) {
    if (/<style/i.test(cssRaw)) {
      const parsed = new DOMParser().parseFromString(cssRaw, 'text/html')
      parsed.querySelectorAll('style').forEach((style) => {
        headStyles += style.outerHTML
      })
    } else {
      headStyles = `<style>${escapeClosingStyleTag(cssRaw)}</style>`
    }
  }

  let bodyScripts = ''
  const trimmedScript = scriptRaw.trim()
  if (trimmedScript) {
    if (/<script/i.test(trimmedScript)) {
      const parsed = new DOMParser().parseFromString(trimmedScript, 'text/html')
      parsed.querySelectorAll('script').forEach((node) => {
        bodyScripts += scriptElementToSrcDocString(node)
      })
    } else {
      bodyScripts = `<script>${escapeClosingScriptTag(trimmedScript)}<\/script>`
    }
  }

  const head = `<meta charset="utf-8"><style>html,body{margin:0}</style>${headStyles}`
  const body = `${htmlRaw}${bodyScripts}`
  return `<!DOCTYPE html><html><head>${head}</head><body>${body}</body></html>`
}

function syncIframeHeight(iframe: HTMLIFrameElement) {
  const doc = iframe.contentDocument
  if (!doc?.body) return
  const h = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight)
  if (h > 0) {
    iframe.style.height = `${Math.ceil(h)}px`
  }
}

function bindIframeAutoHeight(iframe: HTMLIFrameElement): () => void {
  let ro: ResizeObserver | null = null
  let rafId = 0
  const timeoutIds: ReturnType<typeof setTimeout>[] = []

  const scheduleSync = () => {
    cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(() => syncIframeHeight(iframe))
  }

  const onLoad = () => {
    ro?.disconnect()
    ro = null
    const doc = iframe.contentDocument
    if (doc?.body) {
      ro = new ResizeObserver(scheduleSync)
      ro.observe(doc.body)
      ro.observe(doc.documentElement)
    }
    scheduleSync()
    for (const ms of [0, 50, 200, 800, 2000]) {
      timeoutIds.push(setTimeout(scheduleSync, ms))
    }
  }

  iframe.addEventListener('load', onLoad)

  return () => {
    iframe.removeEventListener('load', onLoad)
    ro?.disconnect()
    cancelAnimationFrame(rafId)
    for (const id of timeoutIds) clearTimeout(id)
    iframe.style.removeProperty('height')
  }
}

function injectEmbedIntoHost(host: HTMLElement, cssRaw: string, htmlRaw: string, scriptRaw: string) {
  host.replaceChildren()

  const reset = document.createElement('style')
  reset.textContent = LIGHT_SCOPED_RESET
  host.appendChild(reset)

  if (cssRaw) {
    if (/<style/i.test(cssRaw)) {
      const parsed = new DOMParser().parseFromString(cssRaw, 'text/html')
      parsed.querySelectorAll('style').forEach((style) => {
        host.appendChild(document.importNode(style, true))
      })
    } else {
      const style = document.createElement('style')
      style.textContent = cssRaw
      host.appendChild(style)
    }
  }

  if (htmlRaw) {
    const slot = document.createElement('div')
    slot.className = 'portal-mobile-ad-markup'
    slot.innerHTML = htmlRaw
    host.appendChild(slot)
  }

  if (scriptRaw) {
    appendScriptsFromString(host, scriptRaw)
  }
}

export const PortalMobileAdSlot: React.FC<{
  className?: string
  css?: string | null
  html?: string | null
  script?: string | null
  /** When false, do not hide on large viewports (e.g. DOM-targeted ad slots). Default: true. */
  mobileOnly?: boolean
  /**
   * When true, render embed in an iframe (`srcdoc`) so scripts see `iframe.contentDocument`
   * instead of the host page. Use for tags that assume a standalone document.
   */
  useIframe?: boolean
}> = ({ className, css, html, script, mobileOnly = true, useIframe = false }) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const hasContent = Boolean(html?.trim() || css?.trim() || script?.trim())

  useEffect(() => {
    const cssRaw = css?.trim() ?? ''
    const htmlRaw = html?.trim() ?? ''
    const scriptRaw = script?.trim() ?? ''
    const empty = !cssRaw && !htmlRaw && !scriptRaw

    if (useIframe) {
      const iframe = iframeRef.current
      if (empty) {
        if (iframe) {
          iframe.srcdoc = ''
          iframe.style.removeProperty('height')
        }
        return
      }
      if (!iframe) return

      const unbindHeight = bindIframeAutoHeight(iframe)
      iframe.srcdoc = buildIframeSrcDoc(cssRaw, htmlRaw, scriptRaw)

      return () => {
        unbindHeight()
        iframe.srcdoc = ''
      }
    }

    const host = rootRef.current
    if (empty) {
      host?.replaceChildren()
      return
    }
    if (!host) return

    injectEmbedIntoHost(host, cssRaw, htmlRaw, scriptRaw)

    return () => {
      host.replaceChildren()
    }
  }, [css, html, script, useIframe])

  if (!hasContent) {
    return null
  }

  if (useIframe) {
    return (
      <iframe
        className={cn(
          'isolate block min-h-[1px] w-full min-w-0 border-0',
          mobileOnly && 'lg:hidden',
          className,
        )}
        ref={iframeRef}
        title="Embedded advertisement"
        sandbox="allow-scripts allow-popups allow-forms allow-same-origin"
        suppressHydrationWarning
      />
    )
  }

  return (
    <div
      className={cn('portal-mobile-ad-slot-root isolate min-w-0', mobileOnly && 'lg:hidden', className)}
      ref={rootRef}
      suppressHydrationWarning
    />
  )
}

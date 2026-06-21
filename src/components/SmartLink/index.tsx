import Link from 'next/link'
import React from 'react'

import { sanitizeHref } from '@/utilities/safeHref'

/** True when the URL must use a native anchor (http(s), mailto, tel), not Next `Link`. */
export function isNativeHref(href: string): boolean {
  const h = href.trim()
  return (
    h.startsWith('http://') ||
    h.startsWith('https://') ||
    h.startsWith('mailto:') ||
    h.startsWith('tel:')
  )
}

export type SmartLinkProps = {
  href: string
  className?: string
  children: React.ReactNode
  style?: React.CSSProperties
}

/** Next `Link` for in-app paths; native `a` for http(s) (new tab), mailto, tel. */
export function SmartLink({ href, className, children, style }: SmartLinkProps) {
  const safe = sanitizeHref(href)

  // href không an toàn (javascript:, data:, //evil.com…) -> không render link.
  if (!safe) {
    return (
      <span className={className} style={style}>
        {children}
      </span>
    )
  }

  if (isNativeHref(safe)) {
    const isHttp = safe.startsWith('http://') || safe.startsWith('https://')
    return (
      <a
        className={className}
        style={style}
        href={safe}
        {...(isHttp ? { rel: 'noopener noreferrer', target: '_blank' } : {})}
      >
        {children}
      </a>
    )
  }

  return (
    <Link className={className} href={safe} style={style}>
      {children}
    </Link>
  )
}

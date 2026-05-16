import Link from 'next/link'
import React from 'react'

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
  const trimmed = href.trim()

  if (isNativeHref(trimmed)) {
    const isHttp = trimmed.startsWith('http://') || trimmed.startsWith('https://')
    return (
      <a
        className={className}
        style={style}
        href={trimmed}
        {...(isHttp ? { rel: 'noopener noreferrer', target: '_blank' } : {})}
      >
        {children}
      </a>
    )
  }

  return (
    <Link className={className} href={trimmed} style={style}>
      {children}
    </Link>
  )
}

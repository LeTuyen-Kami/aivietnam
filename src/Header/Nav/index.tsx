'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { cn } from '@/utilities/ui'

/** Red house + yellow star (home / trang chủ), mobile nav only */
function MobileHomeToRootIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      width="100%"
      height="100%"
    >
      <defs>
        <filter id="drop-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="#000" floodOpacity="0.3" />
        </filter>
      </defs>

      <polygon points="250,20 440,160 440,440 60,440 60,160" fill="#E24A0D" />

      <polygon
        points="250,190 281,253 351,263 300,312 312,382 250,349 188,382 200,312 149,263 219,253"
        fill="#FFEF00"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinejoin="round"
        filter="url(#drop-shadow)"
      />
    </svg>
  )
}

export type HeaderNavVariant = 'desktop' | 'mobile'

export const HeaderNav: React.FC<{ data: HeaderType; variant?: HeaderNavVariant }> = ({
  data,
  variant = 'desktop',
}) => {
  const navItems =
    data?.navItems?.filter((item) => {
      if (variant === 'mobile') {
        return (item?.link?.reference?.value as { slug: string })?.slug !== 'home'
      }
      return true
    }) ?? []

  const pathname = usePathname()
  const normalizedPathname = pathname === '/' ? pathname : pathname.replace(/\/$/, '')
  const isHomeActive = normalizedPathname === '/'

  const linkNodes = navItems.map(({ link }, i) => {
    const href =
      link?.type === 'reference' &&
      typeof link.reference?.value === 'object' &&
      link.reference.value?.slug
        ? `${link.reference?.relationTo !== 'pages' ? `/${link.reference?.relationTo}` : ''}/${link.reference.value.slug}`
        : link?.url

    const normalizedHref = href ? (href === '/' ? href : href.replace(/\/$/, '')) : null
    const isActive = Boolean(normalizedHref) && normalizedHref === normalizedPathname

    if (variant === 'mobile') {
      return (
        <div key={i} className="shrink-0">
          <CMSLink
            {...link}
            appearance="link"
            className={cn(
              'h-auto! px-0! text-[15px] md:text-base font-normal transition-colors hover:text-foreground',
              isActive ? 'text-rose-800' : 'text-muted-foreground md:text-black',
            )}
          />
        </div>
      )
    }

    return (
      <CMSLink
        key={i}
        {...link}
        appearance="link"
        className={cn(
          'h-auto! px-0! text-[13px] font-medium transition-colors',
          isActive ? 'text-rose-800' : 'text-black hover:text-foreground',
        )}
      />
    )
  })

  if (variant === 'mobile') {
    return (
      <nav
        className={cn(
          'flex h-12 items-center gap-4 overflow-x-auto overflow-y-hidden whitespace-nowrap px-1',
          'text-base leading-none text-muted-foreground [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        )}
      >
        <Link
          href="/"
          aria-label="Trang chủ"
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-md p-0.5 transition-[box-shadow,transform] active:scale-[0.97]',
          )}
        >
          <MobileHomeToRootIcon className="h-7 w-7" />
        </Link>
        {linkNodes}
      </nav>
    )
  }

  return (
    <nav className="flex flex-wrap items-center justify-center gap-4 leading-none text-muted-foreground md:gap-6">
      {linkNodes}
    </nav>
  )
}

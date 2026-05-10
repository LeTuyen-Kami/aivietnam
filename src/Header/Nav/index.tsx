'use client'

import { usePathname } from 'next/navigation'
import React from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { cn } from '@/utilities/ui'

export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || []
  const pathname = usePathname()

  return (
    <nav className="flex gap-4 md:gap-6 items-center flex-wrap leading-none text-muted-foreground justify-center">
      {navItems.map(({ link }, i) => {
        const href =
          link?.type === 'reference' &&
          typeof link.reference?.value === 'object' &&
          link.reference.value?.slug
            ? `${link.reference?.relationTo !== 'pages' ? `/${link.reference?.relationTo}` : ''}/${link.reference.value.slug}`
            : link?.url

        const normalizedHref = href ? (href === '/' ? href : href.replace(/\/$/, '')) : null
        const normalizedPathname = pathname === '/' ? pathname : pathname.replace(/\/$/, '')
        const isActive = Boolean(normalizedHref) && normalizedHref === normalizedPathname

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
      })}
    </nav>
  )
}

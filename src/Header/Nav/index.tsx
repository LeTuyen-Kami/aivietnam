'use client'

import React from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'

export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || []

  return (
    <nav className="flex gap-4 md:gap-6 items-center flex-wrap leading-none text-muted-foreground justify-center">
      {navItems.map(({ link }, i) => {
        return (
          <CMSLink
            key={i}
            {...link}
            appearance="link"
            className="h-auto! px-0! text-[13px] font-medium hover:text-foreground transition-colors"
          />
        )
      })}
    </nav>
  )
}

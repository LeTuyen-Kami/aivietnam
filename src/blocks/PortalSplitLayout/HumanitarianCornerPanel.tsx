import React from 'react'

import type { Media as MediaType, PortalSplitLayoutBlock } from '@/payload-types'

import { Media } from '@/components/Media'
import { SmartLink } from '@/components/SmartLink'
import { cn } from '@/utilities/ui'
import { HumanitarianItemShareButton } from './HumanitarianItemShareButton'

type Item = NonNullable<PortalSplitLayoutBlock['humanitarianItems']>[number]

function ItemBlock({ href, image }: Pick<Item, 'href' | 'image'>) {
  const rawHref = typeof href === 'string' ? href.trim() : ''
  const hasMedia = typeof image === 'object' && image !== null && 'id' in image
  const media = hasMedia ? (image as MediaType) : null

  const figure = media ? (
    <Media
      className="block w-full overflow-hidden rounded-sm"
      imgClassName="h-auto w-full object-contain"
      resource={media}
      size="(max-width: 1024px) 100vw, 25vw"
    />
  ) : null

  if (rawHref) {
    return (
      <SmartLink
        className="block outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
        href={rawHref}
      >
        {figure}
      </SmartLink>
    )
  }

  if (!figure) {
    return null
  }

  return figure
}

export const HumanitarianCornerPanel: React.FC<{
  items?: PortalSplitLayoutBlock['humanitarianItems'] | null
}> = ({ items }) => {
  const rows = (items ?? []).filter((row) => {
    const href = typeof row.href === 'string' ? row.href.trim() : ''
    const hasMedia = typeof row.image === 'object' && row.image !== null
    return Boolean(href || hasMedia)
  })

  if (rows.length === 0) {
    return null
  }

  return (
    <div className={cn('block md:hidden ')}>
      <div className="flex flex-col gap-4 md:gap-5">
        {rows.map((row, index) => {
          const safeRowId =
            typeof row.id === 'string' && row.id
              ? row.id.replace(/[^a-zA-Z0-9_-]/g, '-')
              : `item-${index}`
          const fragmentId = `humanitarian-corner-${safeRowId}`

          return (
            <div
              className="relative min-w-0 scroll-mt-24"
              id={fragmentId}
              key={row.id ?? `humanitarian-item-${index}`}
            >
              <ItemBlock href={row.href} image={row.image} />
              <HumanitarianItemShareButton
                className="absolute top-4 right-4 z-10"
                fragmentId={fragmentId}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

import React from 'react'

import type { HumanitiesCornerBlock as HumanitiesCornerBlockData, Post } from '@/payload-types'

import { Media } from '@/components/Media'
import { SmartLink } from '@/components/SmartLink'
import { cn } from '@/utilities/ui'

type Props = HumanitiesCornerBlockData & {
  disableInnerContainer?: boolean
}

type ResolvedRow = {
  title: string
  href: string
}

function resolveRow(
  row: NonNullable<HumanitiesCornerBlockData['items']>[number],
): ResolvedRow | null {
  if (row.itemType === 'manual') {
    const title = typeof row.title === 'string' ? row.title.trim() : ''
    const href = typeof row.href === 'string' ? row.href.trim() : ''
    if (!title || !href) return null
    return { title, href }
  }

  const post = row.post
  if (typeof post === 'object' && post && 'slug' in post) {
    const p = post as Post
    return { title: p.title, href: `/posts/${p.slug}` }
  }

  return null
}

export const HumanitiesCornerBlockComponent: React.FC<Props> = ({
  bannerImage,
  listTitle,
  items,
  disableInnerContainer,
}) => {
  if (typeof bannerImage !== 'object' || !bannerImage) {
    return null
  }

  const rows = (items ?? [])
    .map((row) => resolveRow(row))
    .filter((r): r is ResolvedRow => Boolean(r))

  if (rows.length === 0) {
    return null
  }

  const shell = (
    <section
      className={cn(
        'rounded-lg border border-border/60 bg-card py-6 shadow-sm md:py-8',
        !disableInnerContainer && 'container',
      )}
    >
      <div className="grid grid-cols-1 gap-6 px-4 md:grid-cols-12 md:gap-8 md:px-6 lg:px-8">
        <div className="md:col-span-4">
          <div className="relative aspect-3/4 w-full overflow-hidden rounded-md bg-muted md:min-h-[280px] md:aspect-auto md:h-full">
            <Media
              className="absolute inset-0"
              fill
              imgClassName="h-full w-full object-cover object-center"
              resource={bannerImage}
              size="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        </div>

        <div className="flex flex-col md:col-span-8">
          {listTitle && (
            <h2 className="mb-5 text-center font-serif text-xl font-semibold tracking-wide text-foreground md:mb-6 md:text-2xl">
              {listTitle}
            </h2>
          )}
          <ul className="list-disc space-y-2.5 pl-5 font-serif text-[15px] leading-relaxed text-foreground marker:text-foreground md:text-base">
            {rows.map((row, index) => (
              <li key={`${row.href}-${index}`}>
                <SmartLink
                  className="text-foreground underline-offset-2 transition-colors hover:text-foreground/80 hover:underline"
                  href={row.href}
                >
                  {row.title}
                </SmartLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )

  if (disableInnerContainer) {
    return shell
  }

  return shell
}

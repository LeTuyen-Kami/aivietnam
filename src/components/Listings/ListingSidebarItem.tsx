import Link from 'next/link'

import type { Listing, Media as MediaDoc } from '@/payload-types'

import { Media } from '@/components/Media'

type ListingSidebarItemProps = {
  listing: Pick<Listing, 'id' | 'title' | 'slug' | 'priceLabel' | 'createdAt' | 'thumbnail'>
}

function isMediaDoc(value: Listing['thumbnail']): value is MediaDoc {
  return typeof value === 'object' && value !== null && 'url' in value
}

export function ListingSidebarItem({ listing }: ListingSidebarItemProps) {
  return (
    <Link className="group flex items-start gap-3" href={`/listings/${listing.slug}`}>
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
        {isMediaDoc(listing.thumbnail) ? (
          <Media
            fill
            imgClassName="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            resource={listing.thumbnail}
            size="80px"
          />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-3 text-sm font-semibold leading-5 group-hover:text-primary">
          {listing.title}
        </h3>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-emerald-600">{listing.priceLabel}</span>
          <time className="text-xs text-muted-foreground" dateTime={listing.createdAt}>
            {new Date(listing.createdAt).toLocaleDateString('vi-VN')}
          </time>
        </div>
      </div>
    </Link>
  )
}

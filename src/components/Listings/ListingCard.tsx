import Link from 'next/link'

import type { Listing, Media as MediaDoc } from '@/payload-types'

import { Media } from '@/components/Media'
import { Clock3, ImageIcon, MapPin } from 'lucide-react'

type ListingCardProps = {
  listing: Pick<
    Listing,
    | 'id'
    | 'title'
    | 'slug'
    | 'summary'
    | 'priceLabel'
    | 'city'
    | 'district'
    | 'createdAt'
    | 'thumbnail'
    | 'gallery'
    | 'contactName'
  >
}

function isMediaDoc(value: Listing['thumbnail']): value is MediaDoc {
  return typeof value === 'object' && value !== null && 'url' in value
}

export function ListingCard({ listing }: ListingCardProps) {
  const location = [listing.city, listing.district].filter(Boolean).join(', ')
  const imageCount = listing.gallery?.length ?? 0

  return (
    <article className="group overflow-hidden rounded-2xl border border-border  shadow-sm">
      <Link className="grid md:grid-cols-[260px_minmax(0,1fr)]" href={`/listings/${listing.slug}`}>
        <div className="relative aspect-16/10 overflow-hidden bg-muted md:aspect-auto md:h-full">
          {isMediaDoc(listing.thumbnail) ? (
            <Media
              fill
              imgClassName="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
              resource={listing.thumbnail}
              size="(max-width: 768px) 100vw, 260px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Chưa có ảnh
            </div>
          )}

          {imageCount > 0 ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-slate-950/70 via-slate-950/25 to-transparent px-3 py-2 text-white">
              <ImageIcon className="h-4 w-4" />
              <span>{imageCount}</span>
            </div>
          ) : null}
        </div>

        <div className="space-y-3 p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-orange-600 group-hover:text-orange-500">
              {listing.title}
            </h2>
            <time
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-500"
              dateTime={listing.createdAt}
            >
              <Clock3 className="h-4 w-4" />

              {new Date(listing.createdAt).toLocaleDateString('vi-VN')}
            </time>
          </div>

          <p className="text-lg font-semibold text-emerald-500">{listing.priceLabel}</p>

          {location ? (
            <p className="inline-flex line-clamp-1 items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="h-4 w-4" />
              {location}
            </p>
          ) : null}

          {listing.summary ? (
            <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
              {listing.summary}
            </p>
          ) : null}

          <div className="flex items-center gap-2 pt-1 text-sm text-muted-foreground">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
              {listing.contactName.slice(0, 1).toUpperCase()}
            </div>
            <span>{listing.contactName}</span>
          </div>
        </div>
      </Link>
    </article>
  )
}

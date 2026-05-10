import { ChevronRight, Clock3, ImageIcon, MapPin } from 'lucide-react'
import Link from 'next/link'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { Media } from '@/components/Media'
import type {
  Listing,
  ListingCategory,
  ListingsCategoryItemBlock,
  Media as MediaDoc,
} from '@/payload-types'

type Props = ListingsCategoryItemBlock

function isMediaDoc(value: unknown): value is MediaDoc {
  return typeof value === 'object' && value !== null && 'url' in value
}

function resolveGallery(listing: Pick<Listing, 'thumbnail' | 'gallery'>): MediaDoc[] {
  const fromGallery = (listing.gallery ?? []).filter(isMediaDoc)
  const primary = [listing.thumbnail].filter(isMediaDoc)

  return [...primary, ...fromGallery].filter((item, index, arr) => {
    return arr.findIndex((candidate) => candidate.id === item.id) === index
  })
}

function toCategoryId(value: number | ListingCategory): number {
  return typeof value === 'number' ? value : value.id
}

function formatDate(value?: string | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value))
}

async function queryCategoryAndListings(
  props: Props,
): Promise<{ category: ListingCategory; listings: Listing[] } | null> {
  const payload = await getPayload({ config: configPromise })
  const categoryId = toCategoryId(props.category)

  const [categoryDoc, listingsResult] = await Promise.all([
    payload.findByID({
      collection: 'listing-categories',
      id: categoryId,
      depth: 1,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'listings',
      depth: 1,
      limit: props.limit || 4,
      overrideAccess: false,
      pagination: false,
      sort: '-createdAt',
      where: {
        and: [
          {
            _status: {
              equals: 'published',
            },
          },
          {
            categories: {
              in: [categoryId],
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        city: true,
        district: true,
        priceLabel: true,
        createdAt: true,
        thumbnail: true,
        gallery: true,
      },
    }),
  ])

  return {
    category: categoryDoc as ListingCategory,
    listings: listingsResult.docs as Listing[],
  }
}

export async function ListingsCategoryItemBlockComponent(props: Props) {
  const data = await queryCategoryAndListings(props)
  if (!data || !data.listings.length) return null

  const { category, listings } = data
  const sectionTitle = props.title?.trim() || category.title
  const viewMoreLabel = props.viewMoreLabel?.trim() || 'Xem thêm'

  return (
    <section className="container">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-slate-800 md:text-xl">
          {sectionTitle}
        </h2>
        <Link
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
          href={`/listings?category=${encodeURIComponent(category.slug)}`}
        >
          {viewMoreLabel}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-4">
        {listings.map((listing) => {
          const thumbnail = isMediaDoc(listing.thumbnail) ? listing.thumbnail : null
          const location = [listing.district, listing.city].filter(Boolean).join(', ')
          const imageCount = resolveGallery(listing).length

          return (
            <article
              className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
              key={listing.id}
            >
              <Link className="group flex h-full flex-col" href={`/listings/${listing.slug}`}>
                <div className="relative aspect-[1.55/1] overflow-hidden bg-slate-200">
                  {thumbnail ? (
                    <Media
                      fill
                      imgClassName="object-cover transition-transform duration-300 group-hover:scale-105"
                      resource={thumbnail}
                      size="(max-width: 1280px) 100vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      No image
                    </div>
                  )}

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-slate-950/70 via-slate-950/25 to-transparent px-3 py-2 text-white">
                    {imageCount > 0 ? (
                      <div className="inline-flex items-center gap-1 text-sm">
                        <ImageIcon className="h-4 w-4" />
                        <span>{imageCount}</span>
                      </div>
                    ) : null}
                    <time
                      className="ml-auto inline-flex items-center gap-1 text-sm font-medium"
                      dateTime={listing.createdAt}
                    >
                      <Clock3 className="h-4 w-4" />
                      <span>{formatDate(listing.createdAt)}</span>
                    </time>
                  </div>
                </div>

                <div className="flex flex-1 flex-col space-y-4 p-4">
                  <div className="space-y-3">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-[1.45] text-[#0f4a8a] transition-colors group-hover:text-[#0c3b6e]">
                      {listing.title}
                    </h3>
                    <p className="text-base font-semibold leading-none text-emerald-500">
                      {listing.priceLabel}
                    </p>
                  </div>

                  <p className="mt-auto inline-flex line-clamp-1 items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{location || 'Toàn quốc'}</span>
                  </p>
                </div>
              </Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}

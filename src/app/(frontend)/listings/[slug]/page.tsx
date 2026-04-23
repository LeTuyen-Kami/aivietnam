import type { Metadata } from 'next'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { cache } from 'react'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import { Media } from '@/components/Media'
import { ListingSidebarItem } from '@/components/Listings/ListingSidebarItem'
import { ListingGalleryLightbox } from '@/components/Listings/ListingGalleryLightbox'
import { Phone, MessageSquareText, Clock3, MapPin, ChevronLeft } from 'lucide-react'

import type { Listing, ListingCategory, Media as MediaDoc } from '@/payload-types'
import RichText from '@/components/RichText'

export async function generateStaticParams() {
  if (process.env.NODE_ENV === 'development') {
    return []
  }

  const payload = await getPayload({ config: configPromise })
  const listings = await payload.find({
    collection: 'listings',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  return listings.docs.map(({ slug }) => ({ slug }))
}

type Args = {
  params: Promise<{
    slug?: string
  }>
}

function isMediaDoc(value: unknown): value is MediaDoc {
  return typeof value === 'object' && value !== null && 'url' in value
}

function formatDate(value?: string | null) {
  if (!value) return null
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value))
}

function extractLexicalText(value: unknown): string {
  if (!value || typeof value !== 'object') return ''

  const root = (value as { root?: unknown }).root
  if (!root || typeof root !== 'object') return ''

  const textParts: string[] = []

  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return

    const text = (node as { text?: unknown }).text
    if (typeof text === 'string' && text.trim()) textParts.push(text.trim())

    const children = (node as { children?: unknown }).children
    if (Array.isArray(children)) {
      for (const child of children) walk(child)
    }
  }

  walk(root)

  return textParts.join(' ').replace(/\s+/g, ' ').trim()
}

function resolveGallery(listing: Listing): MediaDoc[] {
  const fromGallery = (listing.gallery ?? []).filter(isMediaDoc)
  const primary = [listing.thumbnail, listing.avatar].filter(isMediaDoc)

  return [...primary, ...fromGallery].filter((item, index, arr) => {
    return arr.findIndex((candidate) => candidate.id === item.id) === index
  })
}

function buildZaloHref(raw?: string | null, phone?: string | null) {
  const value = raw?.trim()
  if (value) return value

  const digits = phone?.replace(/\D/g, '')
  return digits ? `https://zalo.me/${digits}` : ''
}

function extractCategories(value?: (number | ListingCategory)[] | null) {
  return (value ?? []).filter(
    (item): item is ListingCategory => typeof item === 'object' && item !== null && 'title' in item,
  )
}

export default async function ListingPage({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const url = `/listings/${decodedSlug}`
  const [listing, recentListings] = await Promise.all([
    queryListingBySlug({ slug: decodedSlug }),
    queryRecentListings({ currentSlug: decodedSlug }),
  ])

  if (!listing) return <PayloadRedirects url={url} />

  const gallery = resolveGallery(listing)
  const location = [listing.address, listing.district, listing.city].filter(Boolean).join(', ')
  const zaloHref = buildZaloHref(listing.zaloUrl, listing.contactPhone)
  const categoryLabel =
    extractCategories(listing.categories)
      .map((item) => item.title)
      .join(', ') || listing.listingType

  return (
    <article className="bg-slate-50/60 pb-16 pt-10">
      <div className="container">
        <PayloadRedirects disableNotFound url={url} />

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-[28px] border border-border bg-background p-6 shadow-sm md:p-8">
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
              href="/listings"
            >
              <ChevronLeft className="h-4 w-4" />
              Về danh sách
            </Link>

            <h1 className="mt-5 text-2xl font-semibold leading-tight text-balance">
              {listing.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 justify-between">
              <span className="text-lg font-semibold text-emerald-500">{listing.priceLabel}</span>
              {listing.createdAt ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock3 className="h-4 w-4" />
                  <time dateTime={listing.createdAt}>{formatDate(listing.createdAt)}</time>
                </div>
              ) : null}
            </div>

            {gallery.length ? (
              <section className="mt-8">
                <ListingGalleryLightbox images={gallery} title={listing.title} />
              </section>
            ) : null}

            <section className="mt-10">
              <h2 className="text-2xl font-semibold">Thông tin mô tả</h2>
              {listing.summary ? (
                <p className="mt-4 text-lg leading-8 text-muted-foreground">{listing.summary}</p>
              ) : null}
              <div className="mt-4 text-base leading-8 text-foreground/90">
                <RichText
                  data={listing.description}
                  className="max-w-none [&>*:first-child]:mt-0 px-0!"
                />
              </div>
              <p className="mt-6 text-lg text-foreground/80">Liên hệ {listing.contactPhone}</p>
            </section>

            <section className="mt-10">
              <h2 className="text-2xl font-semibold">Đặc điểm tin đăng</h2>
              <div className="mt-4 overflow-hidden rounded-2xl border border-border">
                <InfoRow label="Mã tin đăng" value={String(listing.id)} />
                <InfoRow label="Địa chỉ" value={location || 'Đang cập nhật'} />
                <InfoRow label="Gói tin" value={listing.packageName || 'Miễn phí'} />
                <InfoRow label="Danh mục tin đăng" value={categoryLabel} />
              </div>
            </section>

            <section className="mt-10">
              <h2 className="text-2xl font-semibold">Thông tin liên hệ</h2>
              <div className="mt-4 overflow-hidden rounded-2xl border border-border">
                <InfoRow label="Người đăng tin" value={listing.contactName} />
                <InfoRow label="Số điện thoại" value={listing.contactPhone} />
                <InfoRow label="SĐT hỗ trợ" value={listing.supportPhone || 'Không có'} />
                <InfoRow
                  label="Trạng thái"
                  value={
                    listing.statusLabel === 'closed'
                      ? 'Đã chốt'
                      : listing.statusLabel === 'hidden'
                        ? 'Đã ẩn'
                        : 'Đang hiển thị'
                  }
                />
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <section className="rounded-[28px] border border-border bg-background p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-blue-500/80 bg-muted">
                  {isMediaDoc(listing.avatar) ? (
                    <Media fill imgClassName="object-cover" resource={listing.avatar} size="80px" />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">Người đăng</p>
                  <h2 className="truncate text-2xl font-semibold">{listing.contactName}</h2>
                  {location ? (
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-2">{location}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <a
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  href={`tel:${listing.contactPhone}`}
                >
                  <Phone className="h-4 w-4" />
                  {listing.contactPhone}
                </a>

                {zaloHref ? (
                  <a
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    href={zaloHref}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <MessageSquareText className="h-4 w-4" />
                    Nhắn Zalo
                  </a>
                ) : null}
              </div>

              <div className="mt-8">
                <h3 className="text-xl font-semibold">Liên hệ tư vấn</h3>
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
                    Số điện thoại: {listing.contactPhone}
                  </div>
                  <div className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
                    Nội dung liên hệ: {listing.title}
                  </div>
                  <a
                    className="inline-flex w-full items-center justify-center rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    href={`tel:${listing.contactPhone}`}
                  >
                    Gửi yêu cầu
                  </a>
                </div>
              </div>
            </section>

            {recentListings.length ? (
              <section className="rounded-[28px] border border-border bg-background p-5 shadow-sm">
                <h2 className="text-2xl font-semibold">Mới cập nhật</h2>
                <div className="mt-5 space-y-5">
                  {recentListings.map((item) => (
                    <ListingSidebarItem key={item.id} listing={item} />
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </article>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-4 border-b border-border px-5 py-4 last:border-b-0">
      <div className="text-sm font-medium text-muted-foreground">{label}:</div>
      <div className="text-sm leading-6 text-foreground">{value}</div>
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const listing = await queryListingBySlug({ slug: decodedSlug })

  if (!listing) {
    return {
      title: 'Listing | AIVIETNAM',
    }
  }

  const image = isMediaDoc(listing.thumbnail) ? listing.thumbnail : resolveGallery(listing)[0]
  const images = image?.url ? [{ url: image.url }] : undefined
  const descriptionText = listing.summary || extractLexicalText(listing.description)
  const metaDescription = descriptionText ? descriptionText.slice(0, 160) : 'Listing | AIVIETNAM'

  return {
    title: `${listing.title} | AIVIETNAM`,
    description: metaDescription,
    openGraph: {
      title: `${listing.title} | AIVIETNAM`,
      description: metaDescription,
      images,
      type: 'article',
    },
  }
}

const queryListingBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'listings',
    depth: 2,
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})

const queryRecentListings = cache(async ({ currentSlug }: { currentSlug: string }) => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'listings',
    depth: 1,
    draft: false,
    limit: 4,
    overrideAccess: false,
    pagination: false,
    sort: '-updatedAt',
    where: {
      and: [
        {
          slug: {
            not_equals: currentSlug,
          },
        },
        {
          _status: {
            equals: 'published',
          },
        },
      ],
    },
    select: {
      title: true,
      slug: true,
      priceLabel: true,
      createdAt: true,
      thumbnail: true,
    },
  })

  return result.docs
})

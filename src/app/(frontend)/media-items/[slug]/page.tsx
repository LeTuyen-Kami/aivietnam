import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import RichText from '@/components/RichText'
import {
  MediaItemCard,
  MediaItemPlayer,
  formatMediaDate,
  getMediaItemArtwork,
  mediaItemMeta,
  mediaTypeLabels,
} from '@/components/MediaItems'
import type { MediaItem } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import configPromise from '@payload-config'
import {
  ArrowLeft,
  CalendarDays,
  Headphones,
  Image as ImageIcon,
  UserRound,
  Video,
} from 'lucide-react'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { getPayload } from 'payload'
import React, { cache } from 'react'

export const revalidate = 60

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export async function generateStaticParams() {
  if (process.env.NODE_ENV === 'development') return []

  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'media-items',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  return result.docs.map(({ slug }) => ({ slug }))
}

export default async function MediaItemDetailPage({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const url = `/media-items/${decodedSlug}`
  const item = await queryMediaItemBySlug({ slug: decodedSlug })

  if (!item) return <PayloadRedirects url={url} />

  const relatedItems = await queryRelatedMediaItems({ currentId: item.id, type: item.type })
  const date = formatMediaDate(item.publishedAt)
  const meta = mediaItemMeta(item)
  const TypeIcon = item.type === 'podcast' ? Headphones : item.type === 'video' ? Video : ImageIcon

  return (
    <main className="pb-20">
      <PayloadRedirects disableNotFound url={url} />

      <section className="border-b border-border bg-[#f7f3ec]">
        <div className="container px-4 py-8 md:px-0 md:py-10">
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            href="/media-items"
          >
            <ArrowLeft className="h-4 w-4" />
            Media Hub
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,760px)_1fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 bg-background px-3 py-1.5 text-sm font-semibold text-foreground">
                <TypeIcon className="h-4 w-4" />
                {mediaTypeLabels[item.type]}
              </div>
              <h1 className="mt-4 max-w-4xl text-3xl font-bold leading-tight md:text-5xl">
                {item.title}
              </h1>
              {item.summary ? (
                <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
                  {item.summary}
                </p>
              ) : null}
            </div>

            <div className="space-y-3 border border-[#e1d4c2] bg-background p-4 text-sm text-muted-foreground">
              {date ? (
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <time dateTime={item.publishedAt ?? undefined}>{date}</time>
                </div>
              ) : null}
              {item.creatorName ? (
                <div className="flex items-center gap-2">
                  <UserRound className="h-4 w-4" />
                  <span>{item.creatorName}</span>
                </div>
              ) : null}
              {meta ? <p className="leading-6">{meta}</p> : null}
            </div>
          </div>
        </div>
      </section>

      <article className="container px-4 pt-8 md:px-0 md:pt-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,760px)_300px]">
          <div>
            <MediaItemPlayer item={item} />

            {item.content ? (
              <RichText
                className="prose-neutral mt-8 max-w-none"
                data={item.content}
                enableGutter={false}
              />
            ) : item.summary ? (
              <div className="mt-8 border-t border-border pt-6">
                <p className="text-base leading-8 text-foreground">{item.summary}</p>
              </div>
            ) : null}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
            <section className="border border-border p-4">
              <h2 className="text-base font-bold">Thông tin media</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <InfoRow label="Loại" value={mediaTypeLabels[item.type]} />
                <InfoRow label="Nguồn" value={item.sourceName} />
                <InfoRow label="Tác giả" value={item.creatorName} />
                {item.type === 'podcast' ? (
                  <>
                    <InfoRow label="Kênh" value={item.podcast?.channelName} />
                    <InfoRow label="Series" value={item.podcast?.seriesName} />
                    <InfoRow label="Thời lượng" value={item.podcast?.audioDuration} />
                  </>
                ) : null}
                <InfoRow label="Ngày đăng" value={date} />
              </dl>
            </section>

            {getMediaItemArtwork(item) ? (
              <section className="border border-border bg-muted p-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Preview
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Ảnh đại diện đang được dùng cho card và chia sẻ nội dung.
                </p>
              </section>
            ) : null}
          </aside>
        </div>

        {relatedItems.length ? (
          <section className="mt-14 border-t border-border pt-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Cùng loại
                </p>
                <h2 className="mt-1 text-2xl font-bold">Media liên quan</h2>
              </div>
              <Link className="text-sm font-semibold hover:underline" href="/media-items">
                Xem tất cả
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedItems.map((related) => (
                <MediaItemCard item={related} key={related.id} />
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </main>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const item = await queryMediaItemBySlug({ slug: decodeURIComponent(slug) })
  const image = item ? getMediaItemArtwork(item) : null
  const imageUrl = image?.url
    ? image.url.startsWith('http://') || image.url.startsWith('https://')
      ? image.url
      : `${getServerSideURL()}${image.url}`
    : undefined

  return {
    description: item?.summary ?? undefined,
    openGraph: {
      description: item?.summary ?? undefined,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
      title: item?.title ?? 'Media Hub',
      type: item?.type === 'video' ? 'video.other' : 'article',
      url: `/media-items/${item?.slug ?? ''}`,
    },
    title: item ? `${item.title} | Media Hub` : 'Media Hub',
  }
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null

  return (
    <div className="grid grid-cols-[86px_minmax(0,1fr)] gap-3 border-b border-border pb-3 last:border-none last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-semibold text-foreground">{value}</dd>
    </div>
  )
}

const queryMediaItemBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'media-items',
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

  return result.docs?.[0] ?? null
})

const queryRelatedMediaItems = cache(
  async ({ currentId, type }: { currentId: MediaItem['id']; type: MediaItem['type'] }) => {
    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: 'media-items',
      depth: 2,
      draft: false,
      limit: 3,
      overrideAccess: false,
      pagination: false,
      sort: '-publishedAt',
      where: {
        and: [
          {
            id: {
              not_equals: currentId,
            },
          },
          {
            type: {
              equals: type,
            },
          },
          {
            _status: {
              equals: 'published',
            },
          },
        ],
      },
    })

    return result.docs
  },
)

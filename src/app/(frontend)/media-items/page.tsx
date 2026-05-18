import type { Metadata } from 'next'

import {
  MediaItemCard,
  MediaItemType,
  mediaTypeLabels,
  mediaItemMeta,
} from '@/components/MediaItems'
import type { MediaItem } from '@/payload-types'
import configPromise from '@payload-config'
import { Camera, Headphones, Images, PlayCircle } from 'lucide-react'
import { getPayload } from 'payload'
import React from 'react'

export const revalidate = 600

const typeOrder: MediaItemType[] = ['podcast', 'video', 'image']

const sectionCopy: Record<MediaItemType, { description: string; title: string }> = {
  image: {
    description: 'Khoảnh khắc, ảnh tư liệu và hình ảnh từ cộng đồng AI Việt Nam.',
    title: 'Góc ảnh',
  },
  podcast: {
    description: 'Các tập audio, phỏng vấn, chia sẻ và câu chuyện nghe chậm.',
    title: 'Podcast',
  },
  video: {
    description: 'Talk, demo, phóng sự và video học tập có thể xem lại.',
    title: 'Video',
  },
}

export default async function MediaItemsPage() {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'media-items',
    depth: 2,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    sort: '-publishedAt',
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  const items = result.docs
  const grouped = groupByType(items)
  const featured = items[0]
  const counts = typeOrder.map((type) => ({ count: grouped[type].length, type }))

  return (
    <main className="pb-20">
      <section className="border-b border-border bg-[#f7f3ec]">
        <div className="container px-4 py-10 md:px-0 md:py-14">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[#8a4b1a]">
                Media Hub
              </p>
              <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight text-foreground md:text-5xl">
                Podcast, video và hình ảnh từ cộng đồng AI Việt Nam
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Một nơi để nghe, xem và lưu lại các câu chuyện, buổi chia sẻ, sản phẩm học tập và
                khoảnh khắc nổi bật.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {counts.map(({ count, type }) => (
                  <a
                    className="inline-flex items-center gap-2 border border-foreground/15 bg-background px-3 py-2 text-sm font-semibold transition-[background-color,transform] duration-200 ease-out hover:bg-white active:scale-[0.98]"
                    href={`#${type}`}
                    key={type}
                  >
                    {type === 'podcast' ? (
                      <Headphones className="h-4 w-4" />
                    ) : type === 'video' ? (
                      <PlayCircle className="h-4 w-4" />
                    ) : (
                      <Images className="h-4 w-4" />
                    )}
                    {mediaTypeLabels[type]} <span className="text-muted-foreground">{count}</span>
                  </a>
                ))}
              </div>
            </div>

            <aside className="border border-[#e1d4c2] bg-background p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center bg-[#f1e4d2] text-[#8a4b1a]">
                  <Camera className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Mới nhất
                  </p>
                  <p className="line-clamp-1 text-base font-bold">{featured?.title ?? 'Media'}</p>
                </div>
              </div>
              {featured ? (
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {featured.summary || mediaItemMeta(featured) || 'Media item mới được xuất bản.'}
                </p>
              ) : (
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Chưa có media item đã xuất bản.
                </p>
              )}
            </aside>
          </div>
        </div>
      </section>

      <div className="container px-4 pt-10 md:px-0 md:pt-12">
        {items.length ? (
          <div className="space-y-14">
            {typeOrder.map((type) => {
              const sectionItems = grouped[type]
              if (!sectionItems.length) return null

              return (
                <section id={type} key={type} className="scroll-mt-24">
                  <div className="mb-5 flex flex-col justify-between gap-3 border-b border-border pb-4 md:flex-row md:items-end">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        {mediaTypeLabels[type]}
                      </p>
                      <h2 className="mt-1 text-2xl font-bold leading-tight md:text-3xl">
                        {sectionCopy[type].title}
                      </h2>
                    </div>
                    <p className="max-w-xl text-sm leading-6 text-muted-foreground md:text-right">
                      {sectionCopy[type].description}
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {sectionItems.map((item, index) => (
                      <MediaItemCard item={item} key={item.id} priority={index < 3} />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        ) : (
          <div className="border border-dashed border-border bg-muted px-4 py-14 text-center">
            <h2 className="text-xl font-bold">Chưa có media item</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Khi có podcast, video hoặc hình ảnh được publish, chúng sẽ xuất hiện tại đây.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}

export const metadata: Metadata = {
  description: 'Danh sách podcast, video và hình ảnh của AIVIETNAM.',
  title: 'Media Hub | AIVIETNAM',
}

function groupByType(items: MediaItem[]): Record<MediaItemType, MediaItem[]> {
  return {
    image: items.filter((item) => item.type === 'image'),
    podcast: items.filter((item) => item.type === 'podcast'),
    video: items.filter((item) => item.type === 'video'),
  }
}

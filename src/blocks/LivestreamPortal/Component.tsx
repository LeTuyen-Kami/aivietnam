import configPromise from '@payload-config'
import { Radio, Video, Zap } from 'lucide-react'
import { unstable_noStore as noStore } from 'next/cache'
import { headers } from 'next/headers'
import { connection } from 'next/server'
import { getPayload } from 'payload'

import { canBroadcastLivestream } from '@/access/isAdminUser'
import { Media } from '@/components/Media'
import { SmartLink } from '@/components/SmartLink'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Livestream } from '@/payload-types'
import { cn } from '@/utilities/ui'

import { LivestreamPortalView } from './LivestreamPortalView.client'

type Props = {
  heading?: string | null
  description?: string | null
  emptyMessage?: string | null
  adminListLimit?: number | null
  disableInnerContainer?: boolean
}

function statusLabel(status: Livestream['status']): string {
  switch (status) {
    case 'live':
      return 'Đang phát'
    case 'scheduled':
      return 'Đã lên lịch'
    case 'draft':
      return 'Bản nháp'
    case 'ended':
      return 'Đã kết thúc'
    default:
      return status
  }
}

function statusClass(status: Livestream['status']): string {
  switch (status) {
    case 'live':
      return 'bg-rose-500/15 text-rose-700 ring-rose-500/30 dark:text-rose-300'
    case 'scheduled':
      return 'bg-sky-500/15 text-sky-700 ring-sky-500/30 dark:text-sky-300'
    case 'draft':
      return 'bg-amber-500/15 text-amber-800 ring-amber-500/30 dark:text-amber-200'
    case 'ended':
      return 'bg-muted text-muted-foreground ring-border'
    default:
      return 'bg-muted text-muted-foreground ring-border'
  }
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function ViewerLiveCard({
  heading,
  description,
  livestream,
}: {
  heading: string
  description: string | null | undefined
  livestream: Livestream
}) {
  const href = `/live/${encodeURIComponent(livestream.slug)}`
  const coverImage =
    typeof livestream.coverImage === 'object' && livestream.coverImage
      ? livestream.coverImage
      : null
  const scheduledAt = formatDate(livestream.scheduledAt)
  const updatedAt = formatDate(livestream.updatedAt)

  return (
    <section className="container pt-4 md:pt-0">
      <Card className="group isolate overflow-hidden border-border/80 bg-card shadow-xl shadow-black/5 ring-1 ring-black/5 transition-[transform,box-shadow] duration-300 md:hover:-translate-y-1 md:hover:shadow-2xl md:hover:shadow-black/10 dark:ring-white/10">
        <div className="grid min-h-0 gap-0 lg:grid-cols-[1.4fr_0.8fr]">
          <SmartLink className="block min-h-0 w-full" href={href}>
            <div className="relative isolate min-h-[300px] w-full overflow-hidden bg-black sm:min-h-[420px] lg:min-h-[520px]">
              {coverImage ? (
                <Media
                  className="absolute inset-0"
                  fill
                  imgClassName="object-cover object-center transition-transform duration-500 md:group-hover:scale-105"
                  pictureClassName="absolute inset-0 block size-full"
                  resource={coverImage}
                />
              ) : null}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_transparent_34%),linear-gradient(180deg,_rgba(0,0,0,0.12)_0%,_rgba(0,0,0,0.72)_100%)]" />
              <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/10 backdrop-blur">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
                </span>
                LIVE
              </div>
              <div className="absolute inset-x-0 bottom-0 z-10 p-5 text-white sm:p-7 lg:p-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/15 backdrop-blur">
                  <Zap className="h-3.5 w-3.5" aria-hidden />
                  Nhấn để vào màn hình chi tiết
                </div>
                <h2 className="mt-4 max-w-3xl text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                  {livestream.title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm text-white/78 sm:text-base">
                  {livestream.description?.trim() ||
                    description ||
                    'Livestream đang phát trực tiếp.'}
                </p>
              </div>
            </div>
          </SmartLink>

          <div className="flex flex-col justify-between gap-6 bg-linear-to-b from-background to-muted/20 p-6 sm:p-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
                  {heading}
                </p>
                <h3 className="text-2xl font-semibold tracking-tight">Phiên đang phát mới nhất</h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                    statusClass(livestream.status),
                  )}
                >
                  <Radio className="h-3.5 w-3.5" aria-hidden />
                  {statusLabel(livestream.status)}
                </span>
              </div>

              <dl className="space-y-3 text-sm text-muted-foreground">
                {scheduledAt ? (
                  <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-3">
                    <dt>Lịch phát</dt>
                    <dd className="text-right text-foreground">{scheduledAt}</dd>
                  </div>
                ) : null}
                {updatedAt ? (
                  <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-3 last:border-b-0 last:pb-0">
                    <dt>Cập nhật</dt>
                    <dd className="text-right text-foreground">{updatedAt}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <SmartLink className="inline-flex" href={href}>
              <Button className="w-full sm:w-auto" size="lg">
                Xem livestream
              </Button>
            </SmartLink>
          </div>
        </div>
      </Card>
    </section>
  )
}

export const LivestreamPortalBlockComponent = async ({
  description,
  emptyMessage: _emptyMessage,
  heading,
}: Props) => {
  await connection()
  noStore()

  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })
  const serverIsAdmin = canBroadcastLivestream(user)
  const resolvedHeading = heading?.trim() || 'Livestream'
  const resolvedDescription = description?.trim() || null

  const result = await payload.find({
    collection: 'livestreams',
    depth: 0,
    draft: false,
    limit: 1,
    pagination: false,
    sort: '-updatedAt',
    overrideAccess: false,
    where: {
      status: {
        equals: 'live',
      },
    },
  })

  const livestream = result.docs[0] as Livestream | undefined

  const viewerSlot = livestream ? (
    <ViewerLiveCard
      description={resolvedDescription}
      heading={resolvedHeading}
      livestream={livestream}
    />
  ) : null

  return (
    <LivestreamPortalView
      description={resolvedDescription}
      heading={resolvedHeading}
      serverIsAdmin={serverIsAdmin}
      viewerSlot={viewerSlot}
    />
  )
}

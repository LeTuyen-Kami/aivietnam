import type { Media, MediaItem } from '@/payload-types'

import { Media as PayloadMedia } from '@/components/Media'
import { CustomAudioPlayer, CustomVideoPlayer } from '@/components/MediaItems/CustomPlayers'
import { SmartLink } from '@/components/SmartLink'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { cn } from '@/utilities/ui'
import { CalendarDays, Headphones, Image as ImageIcon, Mic2, PlayCircle, Video } from 'lucide-react'

export type MediaItemType = MediaItem['type']

export const mediaTypeLabels: Record<MediaItemType, string> = {
  image: 'Hình ảnh',
  podcast: 'Podcast',
  video: 'Video',
}

const mediaTypeStyles: Record<
  MediaItemType,
  {
    accent: string
    icon: typeof Headphones
    soft: string
  }
> = {
  image: {
    accent: 'text-[#5b4fb3]',
    icon: ImageIcon,
    soft: 'bg-[#f3f0ff] text-[#403481]',
  },
  podcast: {
    accent: 'text-[#8a4b1a]',
    icon: Headphones,
    soft: 'bg-[#fff2df] text-[#714012]',
  },
  video: {
    accent: 'text-[#00684f]',
    icon: Video,
    soft: 'bg-[#e8fbf3] text-[#075940]',
  },
}

export function isMediaDoc(value: unknown): value is Media {
  return typeof value === 'object' && value !== null && 'url' in value
}

export function mediaItemHref(item: Pick<MediaItem, 'slug'>): string {
  return `/media-items/${item.slug}`
}

export function getMediaItemArtwork(item: MediaItem): Media | null {
  if (item.type === 'image' && isMediaDoc(item.image)) return item.image
  if (isMediaDoc(item.thumbnail)) return item.thumbnail
  if (item.type === 'image' && isMediaDoc(item.thumbnail)) return item.thumbnail
  return null
}

export function formatMediaDate(value?: string | null): string {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function mediaItemMeta(item: MediaItem): string {
  const values =
    item.type === 'podcast'
      ? [
          item.podcast?.channelName,
          item.podcast?.seriesName,
          item.podcast?.episodeNumber,
          item.podcast?.speaker,
          item.podcast?.audioDuration,
        ]
      : [item.sourceName, item.creatorName]

  return values
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean)
    .join(' / ')
}

function directMediaUrl(media: Media | null | undefined): string {
  if (!media?.url) return ''
  return getMediaUrl(media.url, media.updatedAt)
}

function getPodcastSource(item: MediaItem): string {
  if (item.type !== 'podcast') return ''
  if (isMediaDoc(item.podcast?.audioMedia)) return directMediaUrl(item.podcast.audioMedia)
  return typeof item.podcast?.audioUrl === 'string' ? item.podcast.audioUrl.trim() : ''
}

function getVideoUploadSource(item: MediaItem): string {
  if (item.type !== 'video' || !isMediaDoc(item.video?.videoMedia)) return ''
  return directMediaUrl(item.video.videoMedia)
}

function getDirectVideoSource(item: MediaItem): string {
  if (item.type !== 'video') return ''
  return typeof item.video?.videoUrl === 'string' ? item.video.videoUrl.trim() : ''
}

function toEmbedUrl(raw: string | null | undefined): string {
  if (!raw || typeof raw !== 'string') return ''

  const trimmed = raw.trim()
  if (!trimmed) return ''

  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'https:') return ''

    if (url.hostname === 'youtu.be') {
      const id = url.pathname.replace(/^\//, '').split('/')[0]
      return id ? `https://www.youtube.com/embed/${id}` : ''
    }

    if (url.hostname.includes('youtube.com')) {
      if (url.pathname.startsWith('/embed/')) return trimmed
      if (url.pathname === '/watch' || url.pathname === '/watch/') {
        const id = url.searchParams.get('v')
        return id ? `https://www.youtube.com/embed/${id}` : ''
      }
      const shorts = url.pathname.match(/^\/shorts\/([^/]+)/)
      return shorts?.[1] ? `https://www.youtube.com/embed/${shorts[1]}` : ''
    }

    if (url.hostname.includes('vimeo.com')) {
      const path = url.pathname.replace(/\/$/, '')
      const numeric = path.match(/\/(\d+)$/)
      if (numeric?.[1]) return `https://player.vimeo.com/video/${numeric[1]}`
      if (path.startsWith('/video/')) return `https://player.vimeo.com${path}`
    }
  } catch {
    return ''
  }

  return ''
}

export function MediaItemCard({ item, priority = false }: { item: MediaItem; priority?: boolean }) {
  const artwork = getMediaItemArtwork(item)
  const style = mediaTypeStyles[item.type]
  const Icon = style.icon
  const meta = mediaItemMeta(item)
  const date = formatMediaDate(item.publishedAt)

  return (
    <SmartLink
      className="group block h-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      href={mediaItemHref(item)}
    >
      <article className="flex h-full flex-col overflow-hidden border border-border bg-background transition-[border-color,transform] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:border-foreground/30 group-active:scale-[0.99]">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {artwork ? (
            <PayloadMedia
              className="absolute inset-0"
              fill
              imgClassName="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.035]"
              priority={priority}
              resource={artwork}
              size="(max-width: 768px) 100vw, 360px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#f4f1ea]">
              <Icon className={cn('h-10 w-10', style.accent)} />
            </div>
          )}
          <span
            className={cn(
              'absolute left-3 top-3 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold',
              style.soft,
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {mediaTypeLabels[item.type]}
          </span>
          {item.type !== 'image' ? (
            <span className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-90 transition-opacity duration-200 ease-out group-hover:opacity-100">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm">
                <PlayCircle className="h-6 w-6" />
              </span>
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h2 className="line-clamp-2 text-[17px] font-bold leading-snug text-foreground">
            {item.title}
          </h2>
          {item.summary ? (
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
              {item.summary}
            </p>
          ) : null}
          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-4 text-xs text-muted-foreground">
            {date ? (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {date}
              </span>
            ) : null}
            {meta ? <span className="line-clamp-1">{meta}</span> : null}
          </div>
        </div>
      </article>
    </SmartLink>
  )
}

export function MediaItemPlayer({ item }: { item: MediaItem }) {
  const artwork = getMediaItemArtwork(item)

  if (item.type === 'image') {
    const image = isMediaDoc(item.image) ? item.image : artwork
    return (
      <div className="overflow-hidden border border-border bg-muted">
        {image ? (
          <PayloadMedia
            imgClassName="h-auto w-full object-contain"
            priority
            resource={image}
            size="(max-width: 1024px) 100vw, 760px"
          />
        ) : (
          <MissingPlayer label="Chưa có ảnh cho media item này" />
        )}
      </div>
    )
  }

  if (item.type === 'podcast') {
    const src = getPodcastSource(item)

    return (
      <div className="border border-[#e8c4a0] bg-[#fff8ef] p-4 md:p-5">
        <div className="flex gap-4">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden bg-[#f2e6d7] md:h-32 md:w-32">
            {artwork ? (
              <PayloadMedia
                className="absolute inset-0"
                fill
                imgClassName="h-full w-full object-cover"
                priority
                resource={artwork}
                size="160px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Mic2 className="h-9 w-9 text-[#8a4b1a]" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#8a4b1a]">Podcast</p>
            <h2 className="mt-1 text-lg font-bold leading-snug md:text-xl">{item.title}</h2>
            {mediaItemMeta(item) ? (
              <p className="mt-2 text-sm leading-6 text-[#6b5344]">{mediaItemMeta(item)}</p>
            ) : null}
          </div>
        </div>
        {src ? (
          <CustomAudioPlayer className="mt-5" src={src} />
        ) : (
          <MissingPlayer className="mt-5" label="Chưa có audio upload hoặc audio URL" />
        )}
      </div>
    )
  }

  const uploadSrc = getVideoUploadSource(item)
  const directSrc = getDirectVideoSource(item)
  const youtubeEmbed = toEmbedUrl(item.video?.youtubeUrl)
  const poster = artwork ? directMediaUrl(artwork) : undefined

  if (youtubeEmbed) {
    return (
      <div className="aspect-video overflow-hidden border border-border bg-black">
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full"
          referrerPolicy="strict-origin-when-cross-origin"
          src={youtubeEmbed}
          title={item.title}
        />
      </div>
    )
  }

  const videoSrc = uploadSrc || directSrc
  if (videoSrc) {
    return <CustomVideoPlayer poster={poster} src={videoSrc} title={item.title} />
  }

  return <MissingPlayer label="Chưa có video upload, YouTube URL hoặc direct URL" />
}

function MissingPlayer({ className, label }: { className?: string; label: string }) {
  return (
    <div
      className={cn(
        'flex min-h-44 items-center justify-center border border-dashed border-border bg-muted px-4 text-center text-sm text-muted-foreground',
        className,
      )}
    >
      {label}
    </div>
  )
}

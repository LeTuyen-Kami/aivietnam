import React from 'react'

import type { Media as MediaType, MediaHubTriptychBlock } from '@/payload-types'

import { Media } from '@/components/Media'
import { SmartLink } from '@/components/SmartLink'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { cn } from '@/utilities/ui'

type Props = MediaHubTriptychBlock & {
  disableInnerContainer?: boolean
}

/** Normalize YouTube/Vimeo URLs to iframe-safe embed URLs (https only). */
export function toIframeEmbedUrl(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') {
    return null
  }
  const trimmed = raw.trim()
  if (!trimmed) {
    return null
  }
  try {
    const u = new URL(trimmed)
    if (u.protocol !== 'https:') {
      return null
    }

    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0]
      if (id) {
        return `https://www.youtube.com/embed/${id}`
      }
    }

    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/embed/')) {
        return trimmed
      }
      if (u.pathname === '/watch' || u.pathname === '/watch/') {
        const v = u.searchParams.get('v')
        if (v) {
          return `https://www.youtube.com/embed/${v}`
        }
      }
      const shorts = u.pathname.match(/^\/shorts\/([^/]+)/)
      if (shorts?.[1]) {
        return `https://www.youtube.com/embed/${shorts[1]}`
      }
    }

    if (u.hostname.includes('vimeo.com')) {
      const path = u.pathname.replace(/\/$/, '')
      const numeric = path.match(/\/(\d+)$/)
      if (numeric?.[1]) {
        return `https://player.vimeo.com/video/${numeric[1]}`
      }
      if (path.startsWith('/video/')) {
        return `https://player.vimeo.com${path}`
      }
    }

    return trimmed
  } catch {
    return null
  }
}

function isDirectHttpsVideoUrl(url: string): boolean {
  try {
    const u = new URL(url.trim())
    if (u.protocol !== 'https:') {
      return false
    }
    const base = (u.pathname.split('?')[0] ?? '').toLowerCase()
    return /\.(mp4|webm|ogg)$/.test(base)
  } catch {
    return false
  }
}

type GridPlayback =
  | { type: 'iframe'; src: string }
  | { type: 'nativeVideo'; src: string }
  | { type: 'mediaFile'; resource: MediaType }

function videoSrcFromMediaDoc(m: MediaType): string | null {
  if (!m.url) {
    return null
  }
  return getMediaUrl(m.url, m.updatedAt)
}

function resolveVideoPlayback(cell: {
  source?: 'embed' | 'media' | null
  embedUrl?: string | null
  videoMedia?: number | MediaType | null
  /** @deprecated old grid schema — thumbnail-only row */
  thumbnail?: number | MediaType | null
}): GridPlayback | 'legacyThumb' | null {
  const mode = cell.source ?? 'embed'

  if (mode === 'media') {
    const m = mediaDoc(cell.videoMedia)
    if (m) {
      return { type: 'mediaFile', resource: m }
    }
    if (mediaDoc(cell.thumbnail)) {
      return 'legacyThumb'
    }
    return null
  }

  const raw = typeof cell.embedUrl === 'string' ? cell.embedUrl.trim() : ''
  if (raw) {
    if (isDirectHttpsVideoUrl(raw)) {
      return { type: 'nativeVideo', src: raw }
    }
    const iframe = toIframeEmbedUrl(raw)
    if (iframe) {
      return { type: 'iframe', src: iframe }
    }
  }

  if (mediaDoc(cell.thumbnail)) {
    return 'legacyThumb'
  }

  return null
}

function posterUrlFromMedia(m: MediaType | null | undefined): string | undefined {
  const doc = mediaDoc(m)
  if (!doc?.url) {
    return undefined
  }
  return getMediaUrl(doc.url, doc.updatedAt) ?? undefined
}

const gridShell =
  'relative aspect-video w-full overflow-hidden rounded-md border border-[#86C9A0]/40 bg-black'

const VideoGridPlayer: React.FC<{
  playback: GridPlayback
  title: string
  /** Poster / preview for native & uploaded video (ignored for iframe embeds). */
  poster?: MediaType | null
}> = ({ playback, title, poster }) => {
  const posterAttr = posterUrlFromMedia(poster)

  if (playback.type === 'iframe') {
    return (
      <div className={gridShell}>
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
          src={playback.src}
          title={title}
        />
      </div>
    )
  }

  if (playback.type === 'nativeVideo') {
    return (
      <div className={gridShell}>
        <video
          className="h-full w-full object-cover"
          controls
          playsInline
          poster={posterAttr}
          preload="metadata"
          src={playback.src}
        />
      </div>
    )
  }

  const src = videoSrcFromMediaDoc(playback.resource)
  if (!src) {
    return (
      <div
        className={cn(
          gridShell,
          'flex items-center justify-center bg-muted px-2 text-center text-xs text-muted-foreground',
        )}
      >
        Thiếu URL file video
      </div>
    )
  }

  return (
    <div className={gridShell}>
      <video
        className="h-full w-full object-cover"
        controls
        playsInline
        poster={posterAttr}
        preload="metadata"
        src={src}
      />
    </div>
  )
}

function mediaDoc(m: MediaType | string | number | null | undefined): MediaType | null {
  if (m && typeof m === 'object') {
    return m as MediaType
  }
  return null
}

const PlayOverlay: React.FC = () => (
  <span
    aria-hidden
    className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15"
  >
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-foreground shadow-sm">
      <svg className="ml-0.5 h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
  </span>
)

export const MediaHubTriptychBlockComponent: React.FC<Props> = (props) => {
  const { disableInnerContainer, podcastColumn, videoColumn, photoColumn } = props

  const podcastItems = podcastColumn?.items ?? []
  const featuredRaw = videoColumn?.featured
  const featuredPosterLegacy = (featuredRaw as { poster?: number | MediaType | null } | undefined)
    ?.poster
  const featuredForPlayback =
    featuredRaw &&
    ({
      source: featuredRaw.source ?? 'embed',
      embedUrl: featuredRaw.embedUrl,
      videoMedia: featuredRaw.videoMedia,
      thumbnail: featuredRaw.thumbnail ?? featuredPosterLegacy,
    } as const)
  const featuredPlayback = featuredForPlayback ? resolveVideoPlayback(featuredForPlayback) : null
  const featuredThumb = mediaDoc(featuredRaw?.thumbnail ?? featuredPosterLegacy)
  const gridItems = videoColumn?.gridItems ?? []
  const bottomItems = photoColumn?.bottomItems ?? []

  const inner = (
    <div className="grid gap-4 lg:grid-cols-3 lg:gap-5 container">
      {/* Podcasts — cream / orange border */}
      <section
        className={cn(
          'flex flex-col rounded-xl border p-4 md:p-5',
          'border-[#E8C4A0] bg-[#FEF8F0]',
        )}
      >
        <h2 className="mb-4 text-center font-serif text-lg font-bold text-[#8B4513] md:text-xl">
          {podcastColumn?.sectionTitle ?? 'Podcasts Radio 📻'}
        </h2>
        <ul className="flex flex-col divide-y divide-[#E8C4A0]/80">
          {podcastItems.map((row, i) => {
            const thumb = mediaDoc(row.thumbnail)
            const href = typeof row.link === 'string' ? row.link.trim() : ''
            const body = (
              <>
                <div className="min-w-0 flex-1 pr-2">
                  <p className="font-serif text-sm font-bold leading-snug text-foreground md:text-base">
                    {row.title}
                  </p>
                  {row.meta ? (
                    <p className="mt-1 text-xs leading-relaxed text-[#6B5344] md:text-[13px]">
                      {row.meta}
                    </p>
                  ) : null}
                </div>
                {thumb ? (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-[#E8C4A0]/60 bg-muted">
                    <Media
                      className="absolute inset-0"
                      fill
                      imgClassName="h-full w-full object-cover"
                      resource={thumb}
                      size="96px"
                    />
                    <PlayOverlay />
                  </div>
                ) : null}
              </>
            )
            return (
              <li key={i} className="flex gap-2 py-3 first:pt-0 last:pb-0">
                {href ? (
                  <SmartLink
                    className="group flex min-w-0 flex-1 gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    href={href}
                  >
                    {body}
                  </SmartLink>
                ) : (
                  <div className="flex min-w-0 flex-1 gap-2">{body}</div>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {/* Video — mint / green border */}
      <section
        className={cn(
          'flex flex-col rounded-xl border p-4 md:p-5',
          'border-[#86C9A0] bg-[#F8FFF9]',
        )}
      >
        <h2 className="mb-4 text-center font-serif text-lg font-bold text-[#8B1538] md:text-xl">
          {videoColumn?.sectionTitle ?? 'Video'}
        </h2>

        <div className="mb-4 overflow-hidden rounded-lg border border-[#86C9A0]/50 bg-black/5">
          {featuredPlayback && featuredPlayback !== 'legacyThumb' ? (
            <VideoGridPlayer
              playback={featuredPlayback}
              poster={featuredThumb}
              title={videoColumn?.featured?.caption ?? 'Video nổi bật'}
            />
          ) : featuredThumb ? (
            <div className="relative aspect-video w-full">
              <Media
                className="absolute inset-0"
                fill
                imgClassName="h-full w-full object-cover"
                resource={featuredThumb}
                size="(max-width: 768px) 100vw, 33vw"
              />
              <PlayOverlay />
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center bg-muted px-3 text-center text-sm text-muted-foreground">
              Chọn URL video hoặc file trong Media, hoặc thêm thumbnail
            </div>
          )}
        </div>
        {videoColumn?.featured?.caption ? (
          <p className="mb-4 font-serif text-sm font-semibold leading-snug text-[#1a3d2e] md:text-base">
            {videoColumn.featured.caption}
          </p>
        ) : null}

        {gridItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {gridItems.map((cell, i) => {
              const href = typeof cell.link === 'string' ? cell.link.trim() : ''
              const playback = resolveVideoPlayback(cell)
              const titleEl = (
                <p className="line-clamp-2 font-serif text-xs font-semibold leading-snug text-[#1a3d2e] md:text-sm">
                  {cell.title}
                </p>
              )
              const titleBlock = href ? (
                <SmartLink
                  className="block outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={href}
                >
                  {titleEl}
                </SmartLink>
              ) : (
                titleEl
              )

              if (playback === 'legacyThumb') {
                const thumb = mediaDoc(cell.thumbnail)
                return (
                  <article key={i} className="flex flex-col gap-1.5">
                    {thumb ? (
                      <div className="relative aspect-video w-full overflow-hidden rounded-md border border-[#86C9A0]/40 bg-muted">
                        <Media
                          className="absolute inset-0"
                          fill
                          imgClassName="h-full w-full object-cover"
                          resource={thumb}
                          size="(max-width: 768px) 50vw, 16vw"
                        />
                        <PlayOverlay />
                      </div>
                    ) : null}
                    {titleBlock}
                  </article>
                )
              }

              if (!playback) {
                return (
                  <article
                    key={i}
                    className="flex flex-col gap-1.5 rounded-md border border-dashed border-[#86C9A0]/50 p-2 text-center text-xs text-muted-foreground"
                  >
                    Thiếu URL hoặc file video
                    {titleBlock}
                  </article>
                )
              }

              return (
                <article key={i} className="flex flex-col gap-1.5">
                  <VideoGridPlayer
                    playback={playback}
                    poster={mediaDoc(cell.thumbnail)}
                    title={cell.title}
                  />
                  {titleBlock}
                </article>
              )
            })}
          </div>
        ) : null}
      </section>

      {/* Photo corner — lavender / purple border */}
      <section
        className={cn(
          'flex flex-col rounded-xl border p-4 md:p-5',
          'border-[#B8A9D9] bg-[#F8F8FF]',
        )}
      >
        <h2 className="mb-4 text-center font-serif text-lg font-bold text-foreground md:text-xl">
          {photoColumn?.sectionTitle ?? 'Góc ảnh 📷'}
        </h2>

        {photoColumn?.featured?.image && typeof photoColumn.featured.image === 'object' ? (
          <>
            <div className="mb-3 overflow-hidden rounded-lg border border-[#B8A9D9]/50">
              <div className="relative aspect-16/10 w-full">
                <Media
                  className="absolute inset-0"
                  fill
                  imgClassName="h-full w-full object-cover"
                  resource={photoColumn.featured.image}
                  size="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            </div>
            <h3 className="font-serif text-base font-bold leading-snug text-foreground md:text-lg">
              {photoColumn.featured.title}
            </h3>
            {photoColumn.featured.dateLine ? (
              <p className="mt-1 text-xs text-muted-foreground md:text-sm">
                {photoColumn.featured.dateLine}
              </p>
            ) : null}
          </>
        ) : null}

        {bottomItems.length > 0 ? (
          <div
            className={cn(
              'mt-4 grid gap-3',
              bottomItems.length > 1 ? 'grid-cols-2' : 'grid-cols-1',
            )}
          >
            {bottomItems.map((item, i) => {
              const img = mediaDoc(item.image)
              const href = typeof item.link === 'string' ? item.link.trim() : ''
              const tile = (
                <article className="flex flex-col gap-1.5">
                  {img ? (
                    <div className="relative aspect-4/3 w-full overflow-hidden rounded-md border border-[#B8A9D9]/40 bg-muted">
                      <Media
                        className="absolute inset-0"
                        fill
                        imgClassName="h-full w-full object-cover"
                        resource={img}
                        size="(max-width: 768px) 50vw, 16vw"
                      />
                    </div>
                  ) : null}
                  <p className="line-clamp-2 font-serif text-xs font-semibold leading-snug text-foreground md:text-sm">
                    {item.title}
                  </p>
                </article>
              )
              return href ? (
                <SmartLink
                  key={i}
                  className="block outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={href}
                >
                  {tile}
                </SmartLink>
              ) : (
                <div key={i}>{tile}</div>
              )
            })}
          </div>
        ) : null}
      </section>
    </div>
  )

  if (disableInnerContainer) {
    return <div className="media-hub-triptych">{inner}</div>
  }

  return <div className="media-hub-triptych container">{inner}</div>
}

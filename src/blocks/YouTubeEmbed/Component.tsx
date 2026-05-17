import React from 'react'

import type { YouTubeEmbedBlock } from '@/payload-types'

type Props = YouTubeEmbedBlock

function toYouTubeEmbedUrl(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null

  const trimmed = raw.trim()
  if (!trimmed) return null

  try {
    const u = new URL(trimmed)

    if (u.protocol !== 'https:') return null

    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0]
      return id ? `https://www.youtube.com/embed/${id}` : null
    }

    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtube-nocookie.com')) {
      if (u.pathname.startsWith('/embed/')) {
        return trimmed
      }

      if (u.pathname === '/watch' || u.pathname === '/watch/') {
        const id = u.searchParams.get('v')
        return id ? `https://www.youtube.com/embed/${id}` : null
      }

      const shorts = u.pathname.match(/^\/shorts\/([^/]+)/)
      if (shorts?.[1]) {
        return `https://www.youtube.com/embed/${shorts[1]}`
      }
    }

    return null
  } catch {
    return null
  }
}

export const YouTubeEmbedBlockComponent: React.FC<Props> = ({ title, videoTitle, youtubeUrl }) => {
  const embedUrl = toYouTubeEmbedUrl(youtubeUrl)
  const trimmedTitle = typeof title === 'string' ? title.trim() : ''
  const trimmedVideoTitle = typeof videoTitle === 'string' ? videoTitle.trim() : ''

  if (!embedUrl || !trimmedVideoTitle) {
    return null
  }

  return (
    <section className="container px-4 md:px-0">
      {trimmedTitle ? (
        <h2 className="mb-2 mt-4 md:mt-0 text-center text-lg font-serif md:text-[26px]! font-semibold uppercase leading-tight text-foreground md:mb-6 md:text-4xl">
          {trimmedTitle}
        </h2>
      ) : null}

      <div className="overflow-hidden border border-border">
        <div className="aspect-video w-full">
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full"
            referrerPolicy="strict-origin-when-cross-origin"
            src={embedUrl}
            title={trimmedVideoTitle}
          />
        </div>
      </div>
    </section>
  )
}

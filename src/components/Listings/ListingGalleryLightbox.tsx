'use client'

import LightGallery from 'lightgallery/react'
import lgThumbnail from 'lightgallery/plugins/thumbnail'
import lgZoom from 'lightgallery/plugins/zoom'
import { Expand } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'

import { Media } from '@/components/Media'
import type { Media as MediaDoc } from '@/payload-types'
import type { InitDetail } from 'lightgallery/lg-events'
import type { GalleryItem } from 'lightgallery/lg-utils'
import type { LightGallery as LightGalleryInstance } from 'lightgallery/lightgallery'

import 'lightgallery/css/lightgallery.css'
import 'lightgallery/css/lg-thumbnail.css'
import 'lightgallery/css/lg-zoom.css'

type ListingGalleryLightboxProps = {
  images: MediaDoc[]
  title: string
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

export function ListingGalleryLightbox({ images, title }: ListingGalleryLightboxProps) {
  const galleryRef = useRef<LightGalleryInstance | null>(null)

  const slides = useMemo<GalleryItem[]>(
    () =>
      images
        .filter((image): image is MediaDoc & { url: string } => Boolean(image.url))
        .map((image) => ({
          src: image.url,
          title: image.alt || title,
          thumb: image.url,
          subHtml: extractLexicalText(image.caption) || image.alt || title,
          download: false,
        })),
    [images, title],
  )

  useEffect(() => {
    galleryRef.current?.refresh(slides)
  }, [slides])

  if (!slides.length) return null

  const openAt = (index: number) => {
    galleryRef.current?.openGallery(index)
  }

  const onInit = ({ instance }: InitDetail) => {
    galleryRef.current = instance
  }

  return (
    <section className="space-y-4">
      <LightGallery
        download={false}
        dynamic
        dynamicEl={slides}
        elementClassNames="hidden"
        licenseKey="0000-0000-000-0000"
        onInit={onInit}
        plugins={[lgThumbnail, lgZoom]}
        speed={400}
      />

      <button
        className="group relative block aspect-16/10 w-full overflow-hidden rounded-[24px] bg-muted text-left"
        onClick={() => openAt(0)}
        type="button"
      >
        <Media
          fill
          priority
          imgClassName="object-cover transition duration-300 group-hover:scale-[1.02]"
          resource={images[0]}
          size="(max-width: 1280px) 100vw, 900px"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 via-black/10 to-transparent px-5 py-4 text-white">
          <span className="text-sm font-medium">Nhấn để xem chi tiết ảnh</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-black/35 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            <Expand className="h-3.5 w-3.5" />
            {slides.length} ảnh
          </span>
        </div>
      </button>

      {slides.length > 1 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {images.slice(1, 5).map((image, index) => (
            <button
              className="group relative block aspect-square overflow-hidden rounded-2xl bg-muted text-left"
              key={image.id}
              onClick={() => openAt(index + 1)}
              type="button"
            >
              <Media
                fill
                imgClassName="object-cover transition duration-300 group-hover:scale-105"
                resource={image}
                size="(max-width: 768px) 50vw, 180px"
              />
              <div className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  )
}

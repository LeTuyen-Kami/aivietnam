/**
 * Prepend (or refresh) Media hub — 3 columns block on Home page.
 * Usage: bun run scripts/update-home-media-hub.ts
 */
import 'dotenv/config'
import { getPayload } from 'payload'

import config from '../src/payload.config'

async function main() {
  const payload = await getPayload({ config })

  const [podcastsResult, videosResult, imagesResult, pagesResult] = await Promise.all([
    payload.find({
      collection: 'media-items',
      depth: 1,
      limit: 5,
      overrideAccess: true,
      sort: '-publishedAt',
      where: {
        type: {
          equals: 'podcast',
        },
      },
    }),
    payload.find({
      collection: 'media-items',
      depth: 1,
      limit: 5,
      overrideAccess: true,
      sort: '-publishedAt',
      where: {
        type: {
          equals: 'video',
        },
      },
    }),
    payload.find({
      collection: 'media-items',
      depth: 1,
      limit: 3,
      overrideAccess: true,
      sort: '-publishedAt',
      where: {
        type: {
          equals: 'image',
        },
      },
    }),
    payload.find({
      collection: 'pages',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { slug: { equals: 'home' } },
    }),
  ])

  const page = pagesResult.docs[0]
  if (!page) {
    console.error('No page with slug "home".')
    process.exit(1)
  }

  const featuredVideo = videosResult.docs[0]
  const gridVideos = videosResult.docs.slice(1, 5)
  const featuredImage = imagesResult.docs[0]
  const bottomImages = imagesResult.docs.slice(1, 3)

  if (podcastsResult.docs.length === 0) {
    console.error('No podcast media items found.')
    process.exit(1)
  }

  if (!featuredVideo) {
    console.error('No video media item found.')
    process.exit(1)
  }

  if (!featuredImage) {
    console.error('No image media item found.')
    process.exit(1)
  }

  const mediaHubTriptychBlock = {
    blockType: 'mediaHubTriptych' as const,
    podcastColumn: {
      sectionTitle: 'Podcasts Radio 📻',
      items: podcastsResult.docs.map((item) => item.id),
    },
    videoColumn: {
      sectionTitle: 'Video',
      featured: featuredVideo.id,
      gridItems: gridVideos.map((item) => item.id),
    },
    photoColumn: {
      sectionTitle: 'Góc ảnh 📷',
      featured: featuredImage.id,
      bottomItems: bottomImages.map((item) => item.id),
    },
  }

  const prev = Array.isArray(page.layout) ? [...page.layout] : []
  const idx = prev.findIndex((b: { blockType?: string }) => b.blockType === 'mediaHubTriptych')

  let layout: typeof prev
  if (idx >= 0) {
    layout = [...prev]
    layout[idx] = { ...mediaHubTriptychBlock, id: (prev[idx] as { id?: string }).id }
  } else {
    layout = [mediaHubTriptychBlock, ...prev]
  }

  await payload.update({
    collection: 'pages',
    id: page.id,
    data: { layout },
    overrideAccess: true,
  })

  console.log(`Home (id ${page.id}): mediaHubTriptych ${idx >= 0 ? 'refreshed' : 'prepended'}.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

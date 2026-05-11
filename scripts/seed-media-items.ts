/**
 * Seed only `media-items`.
 * Usage: bun run seed:media-items
 */
import 'dotenv/config'
import { getPayload } from 'payload'

import type { Media } from '../src/payload-types'
import config from '../src/payload.config'
import { slugifyTitle } from '../src/utilities/slugify'

type MediaRef = number | Media

type SeedItem = {
  title: string
  type: 'podcast' | 'video' | 'image'
  summary: string
  sourceName?: string
  creatorName?: string
  thumbnail?: MediaRef
  image?: MediaRef
  podcast?: {
    audioMedia?: MediaRef
    audioUrl?: string
    speaker?: string
    narrator?: string
    channelName?: string
    seriesName?: string
    episodeNumber?: string
    audioDuration?: string
  }
  video?: {
    sourceType: 'upload' | 'youtube' | 'direct'
    videoMedia?: MediaRef
    youtubeUrl?: string
    videoUrl?: string
  }
}

function mediaId(value: MediaRef | null | undefined): number | undefined {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object') return value.id
  return undefined
}

async function main() {
  const payload = await getPayload({ config })

  const [imagesResult, audioResult, videoResult] = await Promise.all([
    payload.find({
      collection: 'media',
      depth: 0,
      limit: 10,
      overrideAccess: true,
      sort: '-id',
      where: {
        mimeType: {
          contains: 'image',
        },
      },
    }),
    payload.find({
      collection: 'media',
      depth: 0,
      limit: 5,
      overrideAccess: true,
      sort: '-id',
      where: {
        mimeType: {
          contains: 'audio',
        },
      },
    }),
    payload.find({
      collection: 'media',
      depth: 0,
      limit: 5,
      overrideAccess: true,
      sort: '-id',
      where: {
        mimeType: {
          contains: 'video',
        },
      },
    }),
  ])

  const images = imagesResult.docs
  const audio = audioResult.docs[0]
  const uploadedVideo = videoResult.docs[0]

  if (images.length < 3) {
    console.error('Need at least 3 image files in media collection.')
    process.exit(1)
  }

  if (!audio) {
    console.error('Need at least 1 audio file in media collection.')
    process.exit(1)
  }

  if (!uploadedVideo) {
    console.error('Need at least 1 video file in media collection.')
    process.exit(1)
  }

  const seedItems: SeedItem[] = [
    {
      title: 'AI và tương lai loài người',
      type: 'podcast',
      summary: 'Góc nhìn dễ hiểu về AI, xã hội, giáo dục và thay đổi dài hạn.',
      sourceName: 'AI Vietnam',
      creatorName: 'Editorial Team',
      thumbnail: images[0],
      podcast: {
        audioMedia: audio,
        speaker: 'Yuval Noah Harari',
        narrator: 'Đỗ Thành Công',
        channelName: 'Cấy Nền Radio',
        seriesName: 'Tương lai AI',
        episodeNumber: 'Ep. 01',
        audioDuration: '10:00',
      },
    },
    {
      title: 'Khởi đầu tới AGI',
      type: 'podcast',
      summary: 'Tóm lược chặng đường từ mô hình ngôn ngữ tới hệ thống AI tổng quát.',
      sourceName: 'AI Vietnam',
      creatorName: 'Editorial Team',
      thumbnail: images[1],
      podcast: {
        audioMedia: audio,
        speaker: 'OpenAI Story',
        narrator: 'AI Vietnam',
        channelName: 'Podcast AI',
        seriesName: 'Lịch sử AI',
        episodeNumber: 'Ep. 02',
        audioDuration: '10:00',
      },
    },
    {
      title: 'Giới thiệu công nghệ AI',
      type: 'video',
      summary: 'Video ngắn giải thích AI là gì và ứng dụng phổ biến hiện nay.',
      sourceName: 'AI Vietnam',
      creatorName: 'Editorial Team',
      thumbnail: images[0],
      video: {
        sourceType: 'youtube',
        youtubeUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
      },
    },
    {
      title: 'Robot tự động hóa với bộ não AI',
      type: 'video',
      summary: 'Ví dụ thực tế về video upload phát trực tiếp từ media library.',
      sourceName: 'AI Vietnam',
      creatorName: 'Editorial Team',
      thumbnail: images[1],
      video: {
        sourceType: 'upload',
        videoMedia: uploadedVideo,
      },
    },
    {
      title: 'AI thiết lập hệ thống logistics tự động',
      type: 'image',
      summary: 'Ảnh minh họa quy trình logistics và vận hành có AI hỗ trợ.',
      sourceName: 'AI Vietnam',
      creatorName: 'Editorial Team',
      thumbnail: images[2],
      image: images[2],
    },
    {
      title: 'AI ứng dụng trong thể thao điện tử',
      type: 'image',
      summary: 'Minh họa phân tích chiến thuật và dữ liệu thời gian thực trong esports.',
      sourceName: 'AI Vietnam',
      creatorName: 'Editorial Team',
      thumbnail: images[0],
      image: images[0],
    },
  ]

  for (const item of seedItems) {
    const { docs: existing } = await payload.find({
      collection: 'media-items',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: {
        title: {
          equals: item.title,
        },
      },
    })

    const data = {
      title: item.title,
      slug: slugifyTitle(item.title) ?? item.title,
      type: item.type,
      summary: item.summary,
      sourceName: item.sourceName,
      creatorName: item.creatorName,
      publishedAt: new Date().toISOString(),
      thumbnail: mediaId(item.thumbnail),
      image: mediaId(item.image),
      podcast: item.podcast
        ? {
            audioMedia: mediaId(item.podcast.audioMedia),
            audioUrl: item.podcast.audioUrl,
            speaker: item.podcast.speaker,
            narrator: item.podcast.narrator,
            channelName: item.podcast.channelName,
            seriesName: item.podcast.seriesName,
            episodeNumber: item.podcast.episodeNumber,
            audioDuration: item.podcast.audioDuration,
          }
        : undefined,
      video: item.video
        ? {
            sourceType: item.video.sourceType,
            videoMedia: mediaId(item.video.videoMedia),
            youtubeUrl: item.video.youtubeUrl,
            videoUrl: item.video.videoUrl,
          }
        : undefined,
      _status: 'published' as const,
    }

    if (existing[0]) {
      await payload.update({
        collection: 'media-items',
        id: existing[0].id,
        data,
        overrideAccess: true,
      })
      console.log(`updated media-item: ${item.title}`)
      continue
    }

    await payload.create({
      collection: 'media-items',
      data,
      overrideAccess: true,
      draft: false,
    })
    console.log(`created media-item: ${item.title}`)
  }

  const { totalDocs } = await payload.find({
    collection: 'media-items',
    depth: 0,
    limit: 0,
    overrideAccess: true,
  })

  console.log(`done. media-items total: ${totalDocs}`)
  process.exit(0)
}

main().catch((err) => {
  console.error('seed:media-items failed:', err)
  process.exit(1)
})

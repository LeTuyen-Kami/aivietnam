/**
 * Prepend (or refresh) Media hub — 3 columns block on the Home page.
 * Usage: bun run scripts/update-home-media-hub.ts
 */
import 'dotenv/config'
import { getPayload } from 'payload'

import config from '../src/payload.config'

const mediaHubTriptychBlock = {
  blockType: 'mediaHubTriptych' as const,
  podcastColumn: {
    sectionTitle: 'Podcasts Radio 📻',
    items: [
      {
        title: 'A.I và Tương lai của loài người',
        meta: 'Yuval Noah Harari | Giọng đọc: Đỗ Thành Công | Cấy Nền Radio',
        thumbnail: 89,
        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
      {
        title: 'Open AI từ Khởi đầu tới Siêu trí tuệ nhân tạo AGI | Chat GPT',
        meta: 'Cú Thông Thái | youtuber',
        thumbnail: 88,
        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
      {
        title:
          '(P1) “Đối phó” thế nào khi ai gõ cửa? – Những điều cơ bản bạn cần biết về AI',
        meta: 'Spiderum',
        thumbnail: 87,
        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
    ],
  },
  videoColumn: {
    sectionTitle: 'Video',
    featured: {
      source: 'embed' as const,
      embedUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
      caption: '📹 Công nghệ trí tuệ nhân tạo (AI) là gì?',
    },
    gridItems: [
      {
        source: 'embed' as const,
        embedUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        title: '📹 Sự kết nối giữa các công nghệ AI',
        link: '/posts/giao-duc-ai-bai-01',
      },
      {
        source: 'embed' as const,
        embedUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
        title: '📹 Robot tự động hóa với bộ não AI',
        link: '/posts/giao-duc-ai-bai-02',
      },
      {
        source: 'embed' as const,
        embedUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
        title: '📹 Công nghệ AI | Thời đại số mới',
        link: '/posts/giao-duc-ai-bai-03',
      },
      {
        source: 'embed' as const,
        embedUrl: 'https://www.youtube.com/watch?v=L_jWHffIx5E',
        title: '📹 Tối ưu & tiện lợi | Trí tuệ nhân tạo',
        link: '/posts/giao-duc-ai-bai-04',
      },
    ],
  },
  photoColumn: {
    sectionTitle: 'Góc ảnh 📷',
    featured: {
      image: 82,
      title: 'AI thiết lập hệ thống tự động logistic',
      dateLine: 'Thứ 6, 25/05/2025 | 23:43',
    },
    bottomItems: [
      { image: 81, title: 'Công nghệ AI tự động hóa', link: '/posts/giao-duc-ai-bai-05' },
      { image: 80, title: 'AI ứng dụng trong Esport', link: '/ung-dung-ai' },
    ],
  },
}

async function main() {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'pages',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: 'home' } },
  })

  const page = result.docs[0]
  if (!page) {
    console.error('No page with slug "home".')
    process.exit(1)
  }

  const prev = Array.isArray(page.layout) ? [...page.layout] : []
  const idx = prev.findIndex(
    (b: { blockType?: string }) => b.blockType === 'mediaHubTriptych',
  )

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

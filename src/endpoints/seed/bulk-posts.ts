import type { Category, Media, User } from '@/payload-types'

import type { Payload, PayloadRequest } from 'payload'
import type { RequiredDataFromCollectionSlug } from 'payload'

/** 5 danh mục mới — mỗi danh mục 10 bài trong seed (50 bài). */
export const SEED_CATEGORY_DEFS = [
  { title: 'Giáo dục AI', slug: 'giao-duc-ai' },
  { title: 'Thị trường AI', slug: 'thi-truong-ai' },
  { title: 'Khám phá & AI', slug: 'kham-pha-ai' },
  { title: 'Đời sống công nghệ', slug: 'doi-song-cong-nghe' },
  { title: 'Xu hướng công nghệ', slug: 'xu-huong-cong-nghe' },
] as const

function minimalPostContent(paragraph: string): RequiredDataFromCollectionSlug<'posts'>['content'] {
  return {
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: paragraph,
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          textFormat: 0,
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

export async function seedBulkPosts({
  payload,
  req,
  demoAuthor,
  images,
  categoryDocs,
}: {
  payload: Payload
  req: PayloadRequest
  demoAuthor: User
  images: [Media, Media, Media]
  categoryDocs: Category[]
}): Promise<void> {
  const imageIds = [images[0].id, images[1].id, images[2].id]
  let n = 0

  for (const cat of categoryDocs) {
    for (let i = 1; i <= 10; i++) {
      n += 1
      const title = `${cat.title} — Bài demo ${i}`
      const slug = `${cat.slug}-bai-${String(i).padStart(2, '0')}`
      const heroId = imageIds[(n - 1) % 3]
      const paragraph = `Đây là nội dung demo cho bài viết "${title}". Đoạn văn được tạo tự động khi chạy seed (bài ${n}/50, danh mục: ${cat.title}).`

      await payload.create({
        collection: 'posts',
        req,
        depth: 0,
        context: { disableRevalidate: true },
        data: {
          title,
          slug,
          _status: 'published',
          authors: [demoAuthor.id],
          categories: [cat.id],
          publishedAt: new Date(Date.now() - n * 60 * 60 * 1000).toISOString(),
          heroImage: heroId,
          content: minimalPostContent(paragraph),
          meta: {
            title,
            description: paragraph.slice(0, 300),
            image: heroId,
          },
        },
      })
    }
  }

  payload.logger.info(`— Created ${n} seed posts (5 categories × 10).`)
}

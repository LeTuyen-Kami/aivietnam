import type { RequiredDataFromCollectionSlug } from 'payload'

export const navPages: Array<{ title: string; slug: string }> = [
  { title: 'Trang chủ', slug: 'home' },
  { title: 'Giáo dục AI', slug: 'giao-duc-ai' },
  { title: 'Nghiên cứu AI', slug: 'nghien-cuu-ai' },
  { title: 'Ứng dụng AI', slug: 'ung-dung-ai' },
  { title: 'Thương mại AI', slug: 'thuong-mai-ai' },
  { title: 'Hội thảo AI', slug: 'hoi-thao-ai' },
  { title: 'Góc nhân văn', slug: 'goc-nhan-van' },
  { title: 'Hệ sinh thái AI', slug: 'he-sinh-thai-ai' },
  { title: 'Sàn giao dịch AI Việt Nam', slug: 'san-giao-dich-ai-viet-nam' },
]

export const createNavPage = (
  title: string,
  slug: string,
): RequiredDataFromCollectionSlug<'pages'> => ({
  title,
  slug,
  _status: 'published',
  hero: {
    type: 'none',
  },
  layout: [
    {
      blockType: 'content',
      columns: [
        {
          size: 'full',
          richText: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  version: 1,
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  textFormat: 0,
                  children: [
                    {
                      type: 'text',
                      version: 1,
                      text: title,
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                    },
                  ],
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              version: 1,
            },
          },
        },
      ],
    },
  ],
})

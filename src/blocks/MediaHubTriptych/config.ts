import type { Block, TextFieldValidation, UploadFieldSingleValidation } from 'payload'

function checkHttpsUrlString(value: string | null | undefined): true | string {
  if (!value || typeof value !== 'string') {
    return true
  }
  const t = value.trim()
  if (!t) {
    return true
  }
  try {
    const u = new URL(t)
    if (u.protocol !== 'https:') {
      return 'URL must use https://'
    }
    return true
  } catch {
    return 'Enter a valid https URL'
  }
}

export const MediaHubTriptych: Block = {
  slug: 'mediaHubTriptych',
  dbName: 'mht',
  interfaceName: 'MediaHubTriptychBlock',
  labels: {
    singular: {
      en: 'Media hub — 3 columns',
      vi: 'Khu vực media — 3 cột',
    },
    plural: {
      en: 'Media hub — 3 columns',
      vi: 'Các khối media 3 cột',
    },
  },
  fields: [
    {
      type: 'group',
      name: 'podcastColumn',
      label: {
        en: 'Podcasts',
        vi: 'Podcasts',
      },
      fields: [
        {
          name: 'sectionTitle',
          type: 'text',
          label: {
            en: 'Section title',
            vi: 'Tiêu đề mục',
          },
          defaultValue: 'Podcasts Radio 📻',
        },
        {
          name: 'items',
          type: 'array',
          label: {
            en: 'Episodes',
            vi: 'Các tập',
          },
          minRows: 1,
          maxRows: 5,
          labels: {
            singular: {
              en: 'Item',
              vi: 'Mục',
            },
            plural: {
              en: 'Items',
              vi: 'Các mục',
            },
          },
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              label: {
                en: 'Title',
                vi: 'Tiêu đề',
              },
            },
            {
              name: 'meta',
              type: 'textarea',
              label: {
                en: 'Metadata line',
                vi: 'Dòng mô tả phụ',
              },
            },
            {
              name: 'thumbnail',
              type: 'upload',
              relationTo: 'media',
              required: true,
              label: {
                en: 'Thumbnail',
                vi: 'Ảnh thumbnail',
              },
            },
            {
              name: 'link',
              type: 'text',
              label: {
                en: 'Link URL',
                vi: 'Liên kết',
              },
              admin: {
                description: {
                  en: 'Internal path or https://',
                  vi: 'Đường dẫn trong site hoặc https://',
                },
              },
            },
          ],
        },
      ],
    },
    {
      type: 'group',
      name: 'videoColumn',
      label: {
        en: 'Video',
        vi: 'Video',
      },
      fields: [
        {
          name: 'sectionTitle',
          type: 'text',
          label: {
            en: 'Section title',
            vi: 'Tiêu đề mục',
          },
          defaultValue: 'Video',
        },
        {
          type: 'group',
          name: 'featured',
          label: {
            en: 'Featured video',
            vi: 'Video nổi bật',
          },
          fields: [
            {
              name: 'source',
              type: 'select',
              label: {
                en: 'Video source',
                vi: 'Nguồn video',
              },
              defaultValue: 'embed',
              required: true,
              enumName: 'mht_featured_src',
              options: [
                {
                  label: {
                    en: 'External URL (YouTube/Vimeo or direct .mp4/.webm)',
                    vi: 'URL ngoài (YouTube/Vimeo hoặc link file .mp4/.webm)',
                  },
                  value: 'embed',
                },
                {
                  label: {
                    en: 'Media library (uploaded file)',
                    vi: 'Thư viện Media (file đã upload)',
                  },
                  value: 'media',
                },
              ],
            },
            {
              name: 'embedUrl',
              type: 'text',
              label: {
                en: 'Embed / video URL',
                vi: 'URL nhúng / file video',
              },
              validate: ((value, { siblingData }) => {
                const src = (siblingData as { source?: string })?.source ?? 'embed'
                if (src !== 'embed') {
                  return true
                }
                if (!value || typeof value !== 'string' || !value.trim()) {
                  return 'Nhập URL https (YouTube, Vimeo hoặc file .mp4/.webm).'
                }
                return checkHttpsUrlString(value as string)
              }) as TextFieldValidation,
              admin: {
                condition: (_, siblingData) =>
                  (siblingData as { source?: string })?.source !== 'media',
                description: {
                  en: 'https only. Supports YouTube/Vimeo watch links or a direct video file URL.',
                  vi: 'Chỉ https. Hỗ trợ link YouTube/Vimeo hoặc URL trực tiếp tới file video.',
                },
                placeholder: 'https://www.youtube.com/watch?v=...',
              },
            },
            {
              name: 'videoMedia',
              type: 'upload',
              relationTo: 'media',
              filterOptions: {
                mimeType: {
                  contains: 'video',
                },
              },
              label: {
                en: 'Video file',
                vi: 'File video',
              },
              validate: ((value, { siblingData }) => {
                const src = (siblingData as { source?: string })?.source
                if (src !== 'media') {
                  return true
                }
                if (!value) {
                  return 'Chọn file video trong Media.'
                }
                return true
              }) as UploadFieldSingleValidation,
              admin: {
                condition: (_, siblingData) => (siblingData as { source?: string })?.source === 'media',
                description: {
                  en: 'Uploaded video (MP4, WebM, etc.). Renders with native controls.',
                  vi: 'Video đã upload (MP4, WebM…). Hiển thị player có điều khiển.',
                },
              },
            },
            {
              name: 'thumbnail',
              type: 'upload',
              relationTo: 'media',
              label: {
                en: 'Thumbnail',
                vi: 'Ảnh thumbnail',
              },
              admin: {
                description: {
                  en: 'Optional preview or poster image (e.g. before play, or when only thumbnail is set).',
                  vi: 'Ảnh xem trước hoặc poster (ví dụ trước khi phát, hoặc khi chỉ có thumbnail).',
                },
              },
            },
            {
              name: 'caption',
              type: 'text',
              label: {
                en: 'Caption below player',
                vi: 'Chú thích dưới player',
              },
            },
          ],
        },
        {
          name: 'gridItems',
          type: 'array',
          label: {
            en: 'Video grid (2×2)',
            vi: 'Lưới video (2×2)',
          },
          maxRows: 4,
          minRows: 0,
          labels: {
            singular: {
              en: 'Grid item',
              vi: 'Ô lưới',
            },
            plural: {
              en: 'Grid items',
              vi: 'Các ô lưới',
            },
          },
          fields: [
            {
              name: 'source',
              type: 'select',
              label: {
                en: 'Video source',
                vi: 'Nguồn video',
              },
              defaultValue: 'embed',
              required: true,
              enumName: 'mht_grid_src',
              options: [
                {
                  label: {
                    en: 'External URL (YouTube/Vimeo or direct .mp4/.webm)',
                    vi: 'URL ngoài (YouTube/Vimeo hoặc link file .mp4/.webm)',
                  },
                  value: 'embed',
                },
                {
                  label: {
                    en: 'Media library (uploaded file)',
                    vi: 'Thư viện Media (file đã upload)',
                  },
                  value: 'media',
                },
              ],
            },
            {
              name: 'embedUrl',
              type: 'text',
              label: {
                en: 'Embed / video URL',
                vi: 'URL nhúng / file video',
              },
              validate: ((value, { siblingData }) => {
                const src = (siblingData as { source?: string })?.source ?? 'embed'
                if (src !== 'embed') {
                  return true
                }
                if (!value || typeof value !== 'string' || !value.trim()) {
                  return 'Nhập URL https (YouTube, Vimeo hoặc file .mp4/.webm).'
                }
                return checkHttpsUrlString(value as string)
              }) as TextFieldValidation,
              admin: {
                condition: (_, siblingData) =>
                  (siblingData as { source?: string })?.source !== 'media',
                description: {
                  en: 'https only. Supports YouTube/Vimeo watch links or a direct video file URL.',
                  vi: 'Chỉ https. Hỗ trợ link YouTube/Vimeo hoặc URL trực tiếp tới file video.',
                },
                placeholder: 'https://www.youtube.com/watch?v=...',
              },
            },
            {
              name: 'videoMedia',
              type: 'upload',
              relationTo: 'media',
              filterOptions: {
                mimeType: {
                  contains: 'video',
                },
              },
              label: {
                en: 'Video file',
                vi: 'File video',
              },
              validate: ((value, { siblingData }) => {
                const src = (siblingData as { source?: string })?.source
                if (src !== 'media') {
                  return true
                }
                if (!value) {
                  return 'Chọn file video trong Media.'
                }
                return true
              }) as UploadFieldSingleValidation,
              admin: {
                condition: (_, siblingData) => (siblingData as { source?: string })?.source === 'media',
                description: {
                  en: 'Uploaded video (MP4, WebM, etc.). Renders with native controls.',
                  vi: 'Video đã upload (MP4, WebM…). Hiển thị player có điều khiển.',
                },
              },
            },
            {
              name: 'thumbnail',
              type: 'upload',
              relationTo: 'media',
              label: {
                en: 'Thumbnail',
                vi: 'Ảnh thumbnail',
              },
              admin: {
                description: {
                  en: 'Optional preview / poster for native or uploaded video; or static preview when no URL/file.',
                  vi: 'Ảnh xem trước / poster cho video native hoặc file upload; hoặc ảnh tĩnh khi không có URL/file.',
                },
              },
            },
            {
              name: 'title',
              type: 'text',
              required: true,
              label: {
                en: 'Title',
                vi: 'Tiêu đề',
              },
            },
            {
              name: 'link',
              type: 'text',
              label: {
                en: 'Optional link (below title)',
                vi: 'Liên kết tùy chọn (dưới tiêu đề)',
              },
              admin: {
                description: {
                  en: 'Wraps title in a link when set.',
                  vi: 'Nếu có, bao tiêu đề bằng liên kết.',
                },
              },
            },
          ],
        },
      ],
    },
    {
      type: 'group',
      name: 'photoColumn',
      label: {
        en: 'Photo corner',
        vi: 'Góc ảnh',
      },
      fields: [
        {
          name: 'sectionTitle',
          type: 'text',
          label: {
            en: 'Section title',
            vi: 'Tiêu đề mục',
          },
          defaultValue: 'Góc ảnh 📷',
        },
        {
          type: 'group',
          name: 'featured',
          label: {
            en: 'Featured story',
            vi: 'Bài nổi bật',
          },
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              required: true,
              label: {
                en: 'Image',
                vi: 'Ảnh',
              },
            },
            {
              name: 'title',
              type: 'text',
              required: true,
              label: {
                en: 'Title',
                vi: 'Tiêu đề',
              },
            },
            {
              name: 'dateLine',
              type: 'text',
              label: {
                en: 'Date / time line',
                vi: 'Dòng ngày giờ',
              },
              admin: {
                description: {
                  en: 'e.g. Thứ 6, 25/05/2025 | 23:43',
                  vi: 'Ví dụ: Thứ 6, 25/05/2025 | 23:43',
                },
              },
            },
          ],
        },
        {
          name: 'bottomItems',
          type: 'array',
          label: {
            en: 'Bottom row (2 items)',
            vi: 'Hàng dưới (2 mục)',
          },
          maxRows: 2,
          minRows: 0,
          labels: {
            singular: {
              en: 'Item',
              vi: 'Mục',
            },
            plural: {
              en: 'Items',
              vi: 'Các mục',
            },
          },
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              required: true,
              label: {
                en: 'Image',
                vi: 'Ảnh',
              },
            },
            {
              name: 'title',
              type: 'text',
              required: true,
              label: {
                en: 'Title',
                vi: 'Tiêu đề',
              },
            },
            {
              name: 'link',
              type: 'text',
              label: {
                en: 'Link URL',
                vi: 'Liên kết',
              },
            },
          ],
        },
      ],
    },
  ],
}

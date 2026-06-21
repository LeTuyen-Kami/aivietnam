import type { Block, RelationshipFieldSingleValidation, TextFieldValidation } from 'payload'

export const HumanitiesCorner: Block = {
  slug: 'humanitiesCorner',
  interfaceName: 'HumanitiesCornerBlock',
  labels: {
    singular: {
      en: 'Humanities corner (banner + article list)',
      vi: 'Góc nhân văn (ảnh + danh sách bài)',
    },
    plural: {
      en: 'Humanities corner (banner + article list)',
      vi: 'Góc nhân văn (ảnh + danh sách bài)',
    },
  },
  fields: [
    {
      name: 'bannerImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: {
        en: 'Banner image',
        vi: 'Hình ảnh banner',
      },
      admin: {
        description: {
          en: 'Image for the left column (vertical banner).',
          vi: 'Ảnh cột trái (banner dọc).',
        },
      },
    },
    {
      name: 'listTitle',
      type: 'text',
      label: {
        en: 'List title (optional)',
        vi: 'Tiêu đề danh sách (tùy chọn)',
      },
      admin: {
        description: {
          en: 'Optional heading above the list (centered), e.g. section name.',
          vi: 'Tiêu đề tùy chọn phía trên danh sách (căn giữa), ví dụ tên chuyên mục.',
        },
      },
    },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      labels: {
        singular: {
          en: 'List item',
          vi: 'Mục danh sách',
        },
        plural: {
          en: 'List items',
          vi: 'Các mục danh sách',
        },
      },
      fields: [
        {
          name: 'itemType',
          type: 'radio',
          defaultValue: 'post',
          label: {
            en: 'Item type',
            vi: 'Loại mục',
          },
          admin: {
            layout: 'horizontal',
          },
          options: [
            {
              label: {
                en: 'Existing post',
                vi: 'Bài viết có sẵn',
              },
              value: 'post',
            },
            {
              label: {
                en: 'Custom title & URL',
                vi: 'Tự nhập tiêu đề & liên kết',
              },
              value: 'manual',
            },
          ],
        },
        {
          name: 'post',
          type: 'relationship',
          relationTo: 'posts',
          label: {
            en: 'Post',
            vi: 'Bài viết',
          },
          admin: {
            condition: (_, siblingData) => siblingData?.itemType === 'post',
            description: {
              en: 'Title and URL are taken from the post.',
              vi: 'Tiêu đề và URL lấy theo bài viết.',
            },
          },
          validate: ((value, { siblingData }) => {
            if ((siblingData as { itemType?: string })?.itemType !== 'post') {
              return true
            }
            if (!value) {
              return 'Chọn một bài viết.'
            }
            return true
          }) as RelationshipFieldSingleValidation,
        },
        {
          name: 'title',
          type: 'text',
          label: {
            en: 'Title',
            vi: 'Tiêu đề',
          },
          admin: {
            condition: (_, siblingData) => siblingData?.itemType === 'manual',
          },
          validate: ((value, { siblingData }) => {
            if ((siblingData as { itemType?: string })?.itemType !== 'manual') {
              return true
            }
            if (!value || !String(value).trim()) {
              return 'Nhập tiêu đề.'
            }
            return true
          }) as TextFieldValidation,
        },
        {
          name: 'href',
          type: 'text',
          label: {
            en: 'Link',
            vi: 'Liên kết',
          },
          admin: {
            condition: (_, siblingData) => siblingData?.itemType === 'manual',
            description: {
              en: 'Internal path (e.g. /posts/my-slug) or full URL.',
              vi: 'Đường dẫn nội bộ (vd: /posts/slug) hoặc URL đầy đủ.',
            },
          },
          validate: ((value, { siblingData }) => {
            if ((siblingData as { itemType?: string })?.itemType !== 'manual') {
              return true
            }
            if (!value || !String(value).trim()) {
              return 'Nhập địa chỉ liên kết (href).'
            }
            return true
          }) as TextFieldValidation,
        },
      ],
    },
  ],
}

import type {
  Block,
  RelationshipFieldManyValidation,
  RelationshipFieldSingleValidation,
} from 'payload'

export const FeaturedPostsSideMedia: Block = {
  slug: 'featuredPostsSideMedia',
  interfaceName: 'FeaturedPostsSideMediaBlock',
  labels: {
    singular: {
      en: 'Featured posts + side media',
      vi: 'Bài viết nổi bật + media bên cạnh',
    },
    plural: {
      en: 'Featured posts + side media',
      vi: 'Bài viết nổi bật + media bên cạnh',
    },
  },
  fields: [
    {
      name: 'source',
      type: 'select',
      defaultValue: 'manual',
      label: {
        en: 'Source',
        vi: 'Nguồn dữ liệu',
      },
      options: [
        {
          label: {
            en: 'Manual select',
            vi: 'Chọn thủ công',
          },
          value: 'manual',
        },
        {
          label: {
            en: 'Latest 4 posts',
            vi: 'Tự động lấy 4 bài mới nhất',
          },
          value: 'latest',
        },
      ],
      required: true,
      admin: {
        description: {
          en: 'Choose data source for posts.',
          vi: 'Chọn cách lấy dữ liệu bài viết.',
        },
      },
    },
    {
      name: 'mainPost',
      type: 'relationship',
      relationTo: 'posts',
      label: {
        en: 'Main post',
        vi: 'Bài viết chính',
      },
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'manual',
        description: {
          en: 'Main post',
          vi: 'Bài viết chính',
        },
      },
      validate: ((value, { siblingData }) => {
        const source = (siblingData as { source?: string })?.source

        if (source !== 'manual') {
          return true
        }

        if (!value) {
          return 'Please select a main post.'
        }

        return true
      }) as RelationshipFieldSingleValidation,
    },
    {
      name: 'subPosts',
      type: 'relationship',
      relationTo: 'posts',
      hasMany: true,
      label: {
        en: 'Sub posts',
        vi: 'Bài phụ',
      },
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'manual',
        description: {
          en: 'Exactly 2 small posts (first row under the main post).',
          vi: 'Đúng 2 bài phụ (hàng đầu dưới bài chính).',
        },
      },
      validate: ((value, { siblingData }) => {
        const source = (siblingData as { source?: string })?.source

        if (source !== 'manual') {
          return true
        }

        if (!Array.isArray(value) || value.length !== 2) {
          return 'Please select exactly 2 posts.'
        }

        return true
      }) as RelationshipFieldManyValidation,
    },
    {
      name: 'smallRowPromoImage',
      type: 'upload',
      relationTo: 'media',
      label: {
        en: 'Promo image (third column)',
        vi: 'Ảnh quảng bá (cột thứ 3)',
      },
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'manual',
        description: {
          en: 'Third column: full-height image (replaces the former 3rd small post). Optional.',
          vi: 'Cột thứ 3: ảnh full chiều cao (thay bài phụ thứ 3). Không bắt buộc.',
        },
      },
    },
    {
      name: 'smallRowPromoHref',
      type: 'text',
      label: {
        en: 'Promo image link (optional)',
        vi: 'Liên kết ảnh quảng bá (tùy chọn)',
      },
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'manual',
        description: {
          en: 'Optional link when the promo image is clicked (e.g. /posts/slug or https://…).',
          vi: 'Liên kết tùy chọn khi bấm ảnh (vd: /posts/slug hoặc https://…).',
        },
      },
    },
    {
      name: 'sideMedia',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: {
        en: 'Side media',
        vi: 'Media bên cạnh',
      },
      admin: {
        description: {
          en: 'Image/GIF displayed on the right side.',
          vi: 'Hình ảnh/GIF hiển thị ở bên phải.',
        },
      },
    },
    {
      name: 'sideMediaHref',
      type: 'text',
      label: {
        en: 'Side media link (optional)',
        vi: 'Liên kết media bên cạnh (tùy chọn)',
      },
      admin: {
        description: {
          en: 'Optional link when the side image is clicked (e.g. /posts/slug or https://…).',
          vi: 'Liên kết tùy chọn khi bấm ảnh bên phải (vd: /posts/slug hoặc https://…).',
        },
      },
    },
  ],
}

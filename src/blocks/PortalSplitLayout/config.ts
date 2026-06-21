import type {
  Block,
  NumberFieldSingleValidation,
  RelationshipFieldManyValidation,
  RelationshipFieldSingleValidation,
} from 'payload'

const accentOptions = [
  { label: { en: 'Gold', vi: 'Vàng gold' }, value: 'gold' },
  { label: { en: 'Yellow', vi: 'Vàng' }, value: 'yellow' },
  { label: { en: 'Green', vi: 'Xanh lá' }, value: 'green' },
  { label: { en: 'Purple', vi: 'Tím' }, value: 'purple' },
  { label: { en: 'Blue', vi: 'Xanh dương' }, value: 'blue' },
  { label: { en: 'Red', vi: 'Đỏ' }, value: 'red' },
  { label: { en: 'Teal', vi: 'Xanh ngọc' }, value: 'teal' },
]

const HEX_COLOR_REGEX = /^#(?:[0-9A-Fa-f]{3}){1,2}$/

const hexColorValidation = (value: unknown) => {
  if (value == null || value === '') {
    return true
  }

  if (typeof value !== 'string' || !HEX_COLOR_REGEX.test(value.trim())) {
    return 'Enter a valid HEX color (e.g. #005C5C or #0F0).'
  }

  return true
}

export const portalAccentField = {
  name: 'accent',
  type: 'select' as const,
  label: {
    en: 'Accent color',
    vi: 'Màu nhấn',
  },
  defaultValue: 'gold',
  options: accentOptions,
  required: true,
  /** Short PG enum name — avoids exceeding Postgres 63-char identifier limit */
  enumName: 'psl_sec_accent',
}

export const portalAccentCustomHexField = {
  name: 'accentCustomHex',
  type: 'text' as const,
  label: {
    en: 'Custom accent HEX',
    vi: 'Mã HEX màu nhấn tùy chỉnh',
  },
  validate: hexColorValidation,
  admin: {
    description: {
      en: 'Optional HEX override for accent (e.g. #005C5C). Keeps preset when empty.',
      vi: 'HEX tuỳ chọn để ghi đè accent (ví dụ #005C5C). Để trống sẽ dùng màu preset.',
    },
    placeholder: '#005C5C',
  },
}

export const PortalSplitLayout: Block = {
  slug: 'portalSplitLayout',
  /** Short SQL prefix for block tables — avoids Postgres 63-char limit on nested enums */
  dbName: 'psl',
  interfaceName: 'PortalSplitLayoutBlock',
  labels: {
    singular: { en: 'Portal — 2 columns', vi: 'Portal — 2 cột' },
    plural: { en: 'Portal — 2 columns', vi: 'Portal — 2 cột' },
  },
  fields: [
    {
      type: 'collapsible',
      label: {
        en: 'Left column source',
        vi: 'Nguồn dữ liệu cột trái',
      },
      fields: [
        {
          name: 'leftSource',
          type: 'select',
          defaultValue: 'manual',
          required: true,
          enumName: 'psl_left_src',
          options: [
            { label: { en: 'Manual', vi: 'Chọn thủ công' }, value: 'manual' },
            { label: { en: 'Latest posts', vi: 'Bài mới nhất' }, value: 'latest' },
          ],
          admin: {
            description: {
              en: 'Left column: vertical post feed.',
              vi: 'Cột trái: danh sách bài dọc.',
            },
          },
        },
        {
          name: 'leftPosts',
          type: 'relationship',
          relationTo: 'posts',
          hasMany: true,
          admin: {
            condition: (_, siblingData) => siblingData?.leftSource === 'manual',
            description: {
              en: 'Posts for the left column (order is preserved).',
              vi: 'Các bài cho cột trái (giữ thứ tự).',
            },
          },
          validate: ((value, { siblingData }) => {
            if ((siblingData as { leftSource?: string })?.leftSource !== 'manual') {
              return true
            }
            if (!Array.isArray(value) || value.length < 1) {
              return 'Select at least one post.'
            }
            return true
          }) as RelationshipFieldManyValidation,
        },
        {
          name: 'leftLatestLimit',
          type: 'number',
          min: 1,
          max: 30,
          admin: {
            hidden: true,
          },
        },
        {
          name: 'leftCategoryFilters',
          type: 'relationship',
          relationTo: 'categories',
          hasMany: true,
          admin: {
            condition: (_, siblingData) => siblingData?.leftSource === 'latest',
            description: {
              en: 'Filter latest posts by categories (multi-select).',
              vi: 'Lọc bài mới theo danh mục (chọn nhiều).',
            },
          },
        },
        {
          type: 'row',
          admin: {
            condition: (_, siblingData) => siblingData?.leftSource === 'latest',
          },
          fields: [
            {
              name: 'leftLatestFrom',
              type: 'number',
              defaultValue: 1,
              min: 1,
              max: 30,
              label: {
                en: 'Latest from',
                vi: 'Bài mới từ vị trí',
              },
              admin: {
                description: {
                  en: '1-based start position after sorting by newest published date.',
                  vi: 'Vị trí bắt đầu, tính từ 1, sau khi sắp theo bài mới nhất.',
                },
              },
            },
            {
              name: 'leftLatestTo',
              type: 'number',
              defaultValue: 8,
              min: 1,
              max: 30,
              label: {
                en: 'Latest to',
                vi: 'Đến vị trí',
              },
              admin: {
                description: {
                  en: 'Inclusive end position. Example: from 9 to 16 skips the first 8 newest posts.',
                  vi: 'Vị trí kết thúc, có bao gồm. Ví dụ: từ 9 đến 16 sẽ bỏ qua 8 bài mới nhất đầu.',
                },
              },
              validate: ((value, { siblingData }) => {
                if ((siblingData as { leftSource?: string })?.leftSource !== 'latest') {
                  return true
                }

                const from = (siblingData as { leftLatestFrom?: number })?.leftLatestFrom ?? 1

                if (typeof value === 'number' && value < from) {
                  return 'Latest to must be greater than or equal to latest from.'
                }

                return true
              }) as NumberFieldSingleValidation,
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: {
        en: 'Row 1 — two editorial columns',
        vi: 'Hàng 1 — hai cột editorial',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'row1LeftTitle',
              type: 'text',
              label: {
                en: 'Left column title',
                vi: 'Tiêu đề cột trái',
              },
            },
            {
              name: 'row1LeftTitleHref',
              type: 'text',
              label: {
                en: 'Left column title link',
                vi: 'Link tiêu đề cột trái',
              },
              admin: {
                description: {
                  en: 'Optional URL for left column title.',
                  vi: 'URL tùy chọn cho tiêu đề cột trái.',
                },
              },
            },
            {
              name: 'row1LeftAccent',
              type: 'select',
              label: {
                en: 'Left column accent color',
                vi: 'Màu nhấn cột trái',
              },
              defaultValue: 'teal',
              enumName: 'psl_r1_l_ac',
              options: accentOptions,
            },
            {
              name: 'row1LeftAccentCustomHex',
              type: 'text',
              label: {
                en: 'Left column custom accent HEX',
                vi: 'Mã HEX màu nhấn cột trái',
              },
              validate: hexColorValidation,
              admin: {
                placeholder: '#005C5C',
              },
            },
          ],
        },
        {
          name: 'row1CenterGraphic',
          type: 'upload',
          relationTo: 'media',
          label: {
            en: 'Center graphic',
            vi: 'Đồ họa trung tâm',
          },
          admin: {
            description: {
              en: 'Central graphic (ecosystem diagram).',
              vi: 'Ảnh đồ họa trung tâm.',
            },
          },
        },
        {
          name: 'row1TagItems',
          type: 'array',
          labels: {
            singular: { en: 'Tag', vi: 'Nhãn' },
            plural: { en: 'Tags around graphic', vi: 'Nhãn quanh đồ họa' },
          },
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
              label: {
                en: 'Tag label',
                vi: 'Nhãn',
              },
            },
            {
              name: 'href',
              type: 'text',
              label: {
                en: 'Link',
                vi: 'Liên kết',
              },
              admin: {
                description: {
                  en: 'Optional URL',
                  vi: 'URL tùy chọn',
                },
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'row1OrbitRadiusMinPct',
              type: 'number',
              defaultValue: 16,
              min: 6,
              max: 48,
              label: {
                en: 'Orbit radius min %',
                vi: 'Bán kính tối thiểu %',
              },
              admin: {
                description: {
                  en: 'Smallest radius as % of the box’s shorter side (tags closer to center). Pair with max below (default 16–52).',
                  vi: 'Bán kính nhỏ nhất theo % cạnh ngắn khung (nhãn gần tâm). Dùng cùng max bên dưới (mặc định 16–52).',
                },
              },
            },
            {
              name: 'row1OrbitRadiusMaxPct',
              type: 'number',
              defaultValue: 52,
              min: 20,
              max: 60,
              label: {
                en: 'Orbit radius max %',
                vi: 'Bán kính tối đa %',
              },
              admin: {
                description: {
                  en: 'Largest radius before angle squeezing (tags farther out). Must be greater than min.',
                  vi: 'Bán kính lớn nhất trước khi nén góc (nhãn xa tâm). Phải lớn hơn min.',
                },
              },
            },
          ],
        },
        {
          name: 'row1GridItems',
          type: 'array',
          defaultValue: Array.from({ length: 12 }, () => ({ label: '' })),
          labels: {
            singular: { en: 'Grid cell', vi: 'Ô lưới' },
            plural: { en: '4×3 link grid', vi: 'Lưới 4×3' },
          },
          fields: [
            {
              name: 'icon',
              type: 'upload',
              relationTo: 'media',
              label: {
                en: 'Icon',
                vi: 'Icon',
              },
              admin: {
                description: {
                  en: 'Optional small icon',
                  vi: 'Icon nhỏ (tùy chọn)',
                },
              },
            },
            {
              name: 'label',
              type: 'text',
              required: true,
              label: {
                en: 'Cell label',
                vi: 'Nhãn ô',
              },
            },
            {
              name: 'href',
              type: 'text',
              label: {
                en: 'Link',
                vi: 'Liên kết',
              },
              admin: {
                description: {
                  en: 'Optional URL (leave empty for text-only cell).',
                  vi: 'URL tùy chọn (để trống nếu chỉ hiển thị chữ).',
                },
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'row1RightTitle',
              type: 'text',
              label: {
                en: 'Right column title',
                vi: 'Tiêu đề cột phải',
              },
            },
            {
              name: 'row1RightTitleHref',
              type: 'text',
              label: {
                en: 'Right column title link',
                vi: 'Link tiêu đề cột phải',
              },
              admin: {
                description: {
                  en: 'Optional URL for right column title.',
                  vi: 'URL tùy chọn cho tiêu đề cột phải.',
                },
              },
            },
            {
              name: 'row1RightAccent',
              type: 'select',
              label: {
                en: 'Right column accent color',
                vi: 'Màu nhấn cột phải',
              },
              defaultValue: 'purple',
              enumName: 'psl_r1_r_ac',
              options: accentOptions,
            },
            {
              name: 'row1RightAccentCustomHex',
              type: 'text',
              label: {
                en: 'Right column custom accent HEX',
                vi: 'Mã HEX màu nhấn cột phải',
              },
              validate: hexColorValidation,
              admin: {
                placeholder: '#2D1E5F',
              },
            },
          ],
        },
        {
          name: 'row1RightCards',
          type: 'array',
          defaultValue: Array.from({ length: 8 }, () => ({ caption: '' })),
          labels: {
            singular: { en: 'Card', vi: 'Thẻ' },
            plural: { en: '2×4 marketplace cards', vi: 'Thẻ 2×4' },
          },
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              required: true,
              label: {
                en: 'Image',
                vi: 'Hình ảnh',
              },
            },
            {
              name: 'caption',
              type: 'text',
              required: true,
              label: {
                en: 'Caption',
                vi: 'Chú thích',
              },
            },
            {
              name: 'href',
              type: 'text',
              label: {
                en: 'Link',
                vi: 'Liên kết',
              },
              admin: {
                description: {
                  en: 'Optional URL (leave empty for non-clickable card).',
                  vi: 'URL tùy chọn (để trống nếu không cần link).',
                },
              },
            },
          ],
        },
      ],
    },
    {
      label: {
        en: 'Standard sections',
        vi: 'Các mục chuẩn',
      },
      name: 'standardSections',
      type: 'array',
      dbName: 'std',
      minRows: 0,
      maxRows: 5,
      labels: {
        singular: { en: 'Section', vi: 'Mục' },
        plural: { en: 'Standard sections (rows 2–6)', vi: 'Các mục chuẩn (hàng 2–6)' },
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'sectionTitle',
              type: 'text',
              required: true,
              label: {
                en: 'Section title',
                vi: 'Tiêu đề mục',
              },
            },
            {
              name: 'sectionTitleHref',
              type: 'text',
              label: {
                en: 'Section title link',
                vi: 'Link tiêu đề mục',
              },
              admin: {
                description: {
                  en: 'Optional URL for section title.',
                  vi: 'URL tùy chọn cho tiêu đề mục.',
                },
              },
            },
            portalAccentField,
            portalAccentCustomHexField,
          ],
        },
        {
          name: 'featuredPost',
          type: 'relationship',
          relationTo: 'posts',
          required: true,
          label: {
            en: 'Featured post',
            vi: 'Bài nổi bật',
          },
          validate: ((value) => {
            if (!value) {
              return 'Select a featured post.'
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
            description: {
              en: 'Exactly 3 smaller posts',
              vi: 'Đúng 3 bài nhỏ',
            },
          },
          validate: ((value) => {
            if (!Array.isArray(value) || value.length !== 3) {
              return 'Select exactly 3 posts.'
            }
            return true
          }) as RelationshipFieldManyValidation,
        },
        {
          name: 'footerPosts',
          type: 'relationship',
          relationTo: 'posts',
          hasMany: true,
          label: {
            en: 'Footer posts',
            vi: 'Bài chân mục',
          },
          admin: {
            description: {
              en: 'Exactly 6 posts for the 2×3 title grid',
              vi: 'Đúng 6 bài cho lưới tiêu đề 2×3',
            },
          },
          validate: ((value) => {
            if (!Array.isArray(value) || value.length !== 6) {
              return 'Select exactly 6 posts.'
            }
            return true
          }) as RelationshipFieldManyValidation,
        },
      ],
    },
    {
      type: 'collapsible',
      label: {
        en: 'Humanitarian corner (Góc nhân văn)',
        vi: 'Góc nhân văn',
      },
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'humanitarianItems',
          type: 'array',
          dbName: 'hnv_items',
          labels: {
            singular: { en: 'Image + link', vi: 'Ảnh + link' },
            plural: {
              en: 'Humanitarian — images & links',
              vi: 'Góc nhân văn — ảnh & liên kết',
            },
          },
          admin: {
            description: {
              en: 'Each row: media and/or URL. Use SmartLink on the frontend for href.',
              vi: 'Mỗi dòng: ảnh và/hoặc URL. Frontend nên dùng SmartLink cho href.',
            },
          },
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              label: {
                en: 'Image',
                vi: 'Hình ảnh',
              },
              admin: {
                description: {
                  en: 'Optional image or asset.',
                  vi: 'Ảnh hoặc file (tuỳ chọn).',
                },
              },
            },
            {
              name: 'href',
              type: 'text',
              label: {
                en: 'Link',
                vi: 'Liên kết',
              },
              admin: {
                description: {
                  en: 'Optional URL (in-app path, https:, mailto:, tel:).',
                  vi: 'URL tuỳ chọn (đường dẫn app, https:, mailto:, tel:).',
                },
              },
            },
          ],
        },
        {
          name: 'humanitarianArticles',
          type: 'array',
          dbName: 'hnv_art',
          labels: {
            singular: { en: 'Article', vi: 'Bài viết' },
            plural: {
              en: 'Article list (from posts)',
              vi: 'Danh sách bài (chọn từ posts)',
            },
          },
          admin: {
            description: {
              en: 'Ordered list: each row is one post; title and URL come from the post on the frontend.',
              vi: 'Danh sách có thứ tự: mỗi dòng một bài; tiêu đề và URL lấy từ post khi render.',
            },
          },
          fields: [
            {
              name: 'post',
              type: 'relationship',
              relationTo: 'posts',
              required: true,
              label: {
                en: 'Post',
                vi: 'Bài viết',
              },
              admin: {
                description: {
                  en: 'Pick a post; use its title and slug (or canonical URL) in the list UI.',
                  vi: 'Chọn bài; dùng tiêu đề và slug (hoặc URL chuẩn) khi hiển thị danh sách.',
                },
              },
            },
          ],
        },
      ],
    },
  ],
}

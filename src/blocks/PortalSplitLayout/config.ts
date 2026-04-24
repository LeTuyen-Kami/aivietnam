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

export const portalAccentField = {
  name: 'accent',
  type: 'select' as const,
  defaultValue: 'gold',
  options: accentOptions,
  required: true,
  /** Short PG enum name — avoids exceeding Postgres 63-char identifier limit */
  enumName: 'psl_sec_accent',
}

export const PortalSplitLayout: Block = {
  slug: 'portalSplitLayout',
  /** Short SQL prefix for block tables — avoids Postgres 63-char limit on nested enums */
  dbName: 'psl',
  interfaceName: 'PortalSplitLayoutBlock',
  labels: {
    singular: 'Portal — 2 columns',
    plural: 'Portal — 2 columns',
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
              name: 'row1LeftAccent',
              type: 'select',
              defaultValue: 'teal',
              enumName: 'psl_r1_l_ac',
              options: accentOptions,
            },
          ],
        },
        {
          name: 'row1CenterGraphic',
          type: 'upload',
          relationTo: 'media',
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
            },
            {
              name: 'href',
              type: 'text',
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
          minRows: 12,
          maxRows: 12,
          labels: {
            singular: { en: 'Grid cell', vi: 'Ô lưới' },
            plural: { en: '4×3 link grid', vi: 'Lưới 4×3' },
          },
          fields: [
            {
              name: 'icon',
              type: 'upload',
              relationTo: 'media',
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
            },
            {
              name: 'href',
              type: 'text',
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
              name: 'row1RightAccent',
              type: 'select',
              defaultValue: 'purple',
              enumName: 'psl_r1_r_ac',
              options: accentOptions,
            },
          ],
        },
        {
          name: 'row1RightCards',
          type: 'array',
          minRows: 8,
          maxRows: 8,
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
            },
            {
              name: 'caption',
              type: 'text',
              required: true,
            },
            {
              name: 'href',
              type: 'text',
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
            portalAccentField,
          ],
        },
        {
          name: 'featuredPost',
          type: 'relationship',
          relationTo: 'posts',
          required: true,
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
  ],
}

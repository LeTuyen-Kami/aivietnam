import type { Block } from 'payload'

export const ListingsCategoryItem: Block = {
  slug: 'listingsCategoryItem',
  interfaceName: 'ListingsCategoryItemBlock',
  labels: {
    singular: {
      en: 'Listings category item',
      vi: 'Block listings theo danh mục',
    },
    plural: {
      en: 'Listings category items',
      vi: 'Block listings theo danh mục',
    },
  },
  fields: [
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'listing-categories',
      required: true,
      label: {
        en: 'Category',
        vi: 'Danh mục',
      },
    },
    {
      name: 'title',
      type: 'text',
      label: {
        en: 'Title (optional)',
        vi: 'Tiêu đề (tùy chọn)',
      },
      admin: {
        description: {
          en: 'Optional custom title. Leave empty to use category title.',
          vi: 'Tiêu đề tùy chỉnh (để trống sẽ dùng tên danh mục).',
        },
      },
    },
    {
      name: 'limit',
      type: 'number',
      min: 1,
      max: 12,
      defaultValue: 4,
      label: {
        en: 'Limit',
        vi: 'Số lượng tối đa',
      },
    },
    {
      name: 'viewMoreLabel',
      type: 'text',
      defaultValue: 'Xem thêm',
      label: {
        en: 'View more label',
        vi: 'Nhãn nút xem thêm',
      },
    },
  ],
}

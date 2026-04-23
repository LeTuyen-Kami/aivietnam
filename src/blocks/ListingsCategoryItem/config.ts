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
    },
    {
      name: 'title',
      type: 'text',
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
    },
    {
      name: 'viewMoreLabel',
      type: 'text',
      defaultValue: 'Xem thêm',
    },
  ],
}

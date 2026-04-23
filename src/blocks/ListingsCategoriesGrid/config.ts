import type { Block } from 'payload'

export const ListingsCategoriesGrid: Block = {
  slug: 'listingsCategoriesGrid',
  interfaceName: 'ListingsCategoriesGridBlock',
  labels: {
    singular: {
      en: 'Listings categories grid',
      vi: 'Lưới danh mục listings',
    },
    plural: {
      en: 'Listings categories grids',
      vi: 'Lưới danh mục listings',
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      defaultValue: 'Danh mục Listings',
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'all',
      options: [
        {
          label: {
            en: 'All categories',
            vi: 'Tất cả danh mục',
          },
          value: 'all',
        },
        {
          label: {
            en: 'Manual selection',
            vi: 'Chọn thủ công',
          },
          value: 'manual',
        },
      ],
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'listing-categories',
      hasMany: true,
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'manual',
      },
    },
    {
      name: 'limit',
      type: 'number',
      min: 1,
      max: 30,
      defaultValue: 10,
      admin: {
        description: {
          en: 'Only used when source is "All categories".',
          vi: 'Chỉ dùng khi nguồn là "Tất cả danh mục".',
        },
      },
    },
  ],
}

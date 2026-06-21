import type { CollectionConfig } from 'payload'

import { slugField } from 'payload'

import { anyone } from '@/access/anyone'
import { staff } from '@/access/staff'
import { slugifyTitle } from '@/utilities/slugify'

export const ListingCategories: CollectionConfig = {
  slug: 'listing-categories',
  access: {
    create: staff,
    delete: staff,
    read: anyone,
    update: staff,
  },
  admin: {
    defaultColumns: ['title', 'thumbnail', 'updatedAt'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField({
      position: undefined,
      slugify: ({ valueToSlugify }) => slugifyTitle(valueToSlugify),
    }),
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Ảnh thumbnail đại diện cho danh mục listings.',
      },
    },
  ],
}

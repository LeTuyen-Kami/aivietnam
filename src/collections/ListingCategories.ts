import type { CollectionConfig } from 'payload'

import { slugField } from 'payload'

import { anyone } from '@/access/anyone'
import { authenticated } from '@/access/authenticated'
import { slugifyTitle } from '@/utilities/slugify'

export const ListingCategories: CollectionConfig = {
  slug: 'listing-categories',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
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

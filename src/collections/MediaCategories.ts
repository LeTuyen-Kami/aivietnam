import type { CollectionConfig } from 'payload'

import { slugField } from 'payload'
import { adminOnly } from '../access/adminOnly'

import { slugifyTitle } from '../utilities/slugify'

export const MediaCategories: CollectionConfig = {
  slug: 'media-categories',
  access: {
    admin: ({ req }) => adminOnly({ req }) === true,
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
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
  ],
  timestamps: true,
}

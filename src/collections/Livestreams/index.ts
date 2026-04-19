import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

import { isUsersCollectionAdmin } from '@/access/isAdminUser'
import { slugifyTitle } from '@/utilities/slugify'

export const Livestreams: CollectionConfig<'livestreams'> = {
  slug: 'livestreams',
  admin: {
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    useAsTitle: 'title',
  },
  access: {
    create: ({ req: { user } }) => isUsersCollectionAdmin(user),
    delete: ({ req: { user } }) => isUsersCollectionAdmin(user),
    read: ({ req: { user } }) => {
      if (!user) return false
      if (isUsersCollectionAdmin(user)) return true
      return { status: { not_equals: 'draft' } }
    },
    update: ({ req: { user } }) => isUsersCollectionAdmin(user),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField({
      slugify: ({ valueToSlugify }) => slugifyTitle(valueToSlugify),
    }),
    {
      name: 'status',
      type: 'select',
      required: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Live', value: 'live' },
        { label: 'Ended', value: 'ended' },
      ],
    },
    {
      name: 'callId',
      type: 'text',
      required: true,
    },
    {
      name: 'callType',
      type: 'text',
      defaultValue: 'livestream',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'scheduledAt',
      type: 'date',
    },
  ],
  timestamps: true,
}

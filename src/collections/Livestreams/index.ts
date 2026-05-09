import type { CollectionConfig, RowField } from 'payload'
import { slugField } from 'payload'

import { canAccessAdminPanel } from '@/access/isAdminUser'
import { getLivestreamViewerAbsoluteUrl } from '@/utilities/livestreamViewerUrl'
import { slugifyTitle } from '@/utilities/slugify'
import moderator from '../Users/access/mod'

export const Livestreams: CollectionConfig<'livestreams'> = {
  slug: 'livestreams',
  defaultSort: '-updatedAt',
  admin: {
    defaultColumns: ['title', 'slug', 'status', 'scheduledAt', 'updatedAt'],
    livePreview: {
      url: ({ data }) => getLivestreamViewerAbsoluteUrl(data?.slug as string | undefined) ?? '',
    },
    preview: (data) => getLivestreamViewerAbsoluteUrl(data?.slug as string | undefined) ?? '',
    useAsTitle: 'title',
  },
  access: {
    create: moderator,
    delete: moderator,
    read: ({ req: { user } }) => {
      if (!user) {
        return {
          status: { equals: 'live' },
        }
      }
      if (canAccessAdminPanel(user)) return true
      return { status: { not_equals: 'draft' } }
    },
    update: moderator,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField({
      slugify: ({ valueToSlugify }) => slugifyTitle(valueToSlugify),
      overrides: (field: RowField) => {
        const slugText = field.fields[1]
        if (slugText && 'admin' in slugText && slugText.admin) {
          const prev = slugText.admin.components
          slugText.admin = {
            ...slugText.admin,
            components: {
              ...(prev as Record<string, unknown>),
              Cell: '@/components/Livestreams/LivestreamSlugActionsCell#LivestreamSlugActionsCell',
            },
          }
        }
        return field
      },
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
      admin: {
        components: {
          Cell: '@/components/Livestreams/LivestreamStatusCell#LivestreamStatusCell',
        },
      },
    },
    {
      name: 'viewerOps',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/Livestreams/LivestreamViewerLinksField#LivestreamViewerLinksField',
        },
      },
    },
    {
      name: 'broadcasterOps',
      type: 'ui',
      admin: {
        components: {
          Field:
            '@/components/Livestreams/LivestreamBroadcasterLinksField#LivestreamBroadcasterLinksField',
        },
      },
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
      name: 'chatChannelCid',
      type: 'text',
      admin: {
        readOnly: true,
      },
      index: true,
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Ảnh cover dùng cho card ngoài trang và trạng thái chờ trước khi live.',
      },
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

import type { CollectionConfig } from 'payload'

import { canAccessAdminPanel, canBroadcastLivestream } from '@/access/isAdminUser'
import { getLivestreamViewerAbsoluteUrl } from '@/utilities/livestreamViewerUrl'
import { slugifyTitle } from '@/utilities/slugify'

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
    create: ({ req: { user } }) => canBroadcastLivestream(user),
    delete: ({ req: { user } }) => canBroadcastLivestream(user),
    read: ({ req: { user } }) => {
      if (!user) {
        return {
          status: { equals: 'live' },
        }
      }
      if (canAccessAdminPanel(user)) return true
      return { status: { not_equals: 'draft' } }
    },
    update: ({ req: { user } }) => canBroadcastLivestream(user),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'generateSlug',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'When enabled, the slug will auto-generate from the title field on save and autosave.',
        disableBulkEdit: true,
        disableGroupBy: true,
        disableListColumn: true,
        disableListFilter: true,
        hidden: true,
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        components: {
          Field: {
            clientProps: {
              useAsSlug: 'title',
            },
            path: '@payloadcms/next/client#SlugField',
          },
          Cell: '@/components/Livestreams/LivestreamSlugActionsCell#LivestreamSlugActionsCell',
        },
      },
      hooks: {
        beforeValidate: [
          ({ value }) => {
            if (typeof value !== 'string') return value
            return slugifyTitle(value) ?? value
          },
        ],
      },
    },
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

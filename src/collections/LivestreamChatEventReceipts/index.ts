import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { canAccessAdminPanel } from '@/access/isAdminUser'

export const LivestreamChatEventReceipts: CollectionConfig = {
  slug: 'livestream-chat-event-receipts',
  admin: {
    defaultColumns: ['eventId', 'eventType', 'channelCid', 'processedAt'],
    useAsTitle: 'eventId',
  },
  access: {
    create: adminOnly,
    read: ({ req: { user } }) => canAccessAdminPanel(user),
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'eventId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'eventType',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'channelCid',
      type: 'text',
      index: true,
    },
    {
      name: 'processedAt',
      type: 'date',
      required: true,
      index: true,
    },
    {
      name: 'rawPayload',
      type: 'json',
      admin: {
        readOnly: true,
      },
    },
  ],
  timestamps: true,
}

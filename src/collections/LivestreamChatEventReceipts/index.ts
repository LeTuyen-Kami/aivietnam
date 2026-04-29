import type { CollectionConfig } from 'payload'

import { canAccessAdminPanel } from '@/access/isAdminUser'
import admin from '../Users/access/admin'

export const LivestreamChatEventReceipts: CollectionConfig = {
  slug: 'livestream-chat-event-receipts',
  admin: {
    defaultColumns: ['eventId', 'eventType', 'channelCid', 'processedAt'],
    useAsTitle: 'eventId',
  },
  access: {
    create: admin,
    read: ({ req: { user } }) => canAccessAdminPanel(user),
    update: admin,
    delete: admin,
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

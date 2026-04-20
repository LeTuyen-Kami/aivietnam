import type { CollectionConfig } from 'payload'

import { isUsersCollectionAdmin } from '@/access/isAdminUser'

export const LivestreamChatEventReceipts: CollectionConfig = {
  slug: 'livestream-chat-event-receipts',
  admin: {
    defaultColumns: ['eventId', 'eventType', 'channelCid', 'processedAt'],
    useAsTitle: 'eventId',
  },
  access: {
    create: ({ req: { user } }) => isUsersCollectionAdmin(user),
    read: ({ req: { user } }) => isUsersCollectionAdmin(user),
    update: ({ req: { user } }) => isUsersCollectionAdmin(user),
    delete: ({ req: { user } }) => isUsersCollectionAdmin(user),
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

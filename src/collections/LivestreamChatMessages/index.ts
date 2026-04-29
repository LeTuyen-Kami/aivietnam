import type { CollectionConfig } from 'payload'

import { canAccessAdminPanel, isUsersCollectionAdmin } from '@/access/isAdminUser'
import moderator from '../Users/access/mod'

export const LivestreamChatMessages: CollectionConfig = {
  slug: 'livestream-chat-messages',
  admin: {
    defaultColumns: ['channelCid', 'streamMessageId', 'authorName', 'deletedAt', 'updatedAt'],
    useAsTitle: 'streamMessageId',
  },
  access: {
    create: moderator,
    read: ({ req: { user } }) => canAccessAdminPanel(user),
    update: moderator,
    delete: moderator,
  },
  fields: [
    {
      name: 'streamMessageId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'channelCid',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'channelType',
      type: 'text',
      required: true,
    },
    {
      name: 'channelId',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'livestream',
      type: 'relationship',
      relationTo: 'livestreams',
      index: true,
    },
    {
      name: 'authorStreamUserId',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'authorName',
      type: 'text',
    },
    {
      name: 'text',
      type: 'textarea',
    },
    {
      name: 'reactionLikeCount',
      type: 'number',
      defaultValue: 0,
      index: true,
    },
    {
      name: 'createdAtStream',
      type: 'date',
      required: true,
      index: true,
    },
    {
      name: 'updatedAtStream',
      type: 'date',
      required: true,
    },
    {
      name: 'deletedAt',
      type: 'date',
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

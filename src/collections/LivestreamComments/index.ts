import type { CollectionConfig } from 'payload'
import type { Where } from 'payload'

import { authenticatedSiteMember } from '../../access/authenticatedSiteMember'
import { isUsersCollectionAdmin } from '../../access/isAdminUser'
import { getSiteMemberUser } from '../../access/siteMemberUser'
import { deleteRelatedLivestreamCommentLikes } from './hooks/deleteRelatedLivestreamCommentLikes'
import { forceLivestreamCommentAuthor } from './hooks/forceLivestreamCommentAuthor'

export const LivestreamComments: CollectionConfig = {
  slug: 'livestream-comments',
  access: {
    create: authenticatedSiteMember,
    delete: ({ req: { user } }) => {
      if (isUsersCollectionAdmin(user)) return true
      const member = getSiteMemberUser(user)
      if (!member) return false
      return {
        author: {
          equals: member.id,
        },
      }
    },
    read: ({ req: { user } }): boolean | Where => {
      if (isUsersCollectionAdmin(user)) return true
      const member = getSiteMemberUser(user)
      if (!member) return false

      return {
        or: [{ status: { equals: 'approved' } }, { author: { equals: member.id } }],
      }
    },
    update: ({ req: { user } }) => {
      if (isUsersCollectionAdmin(user)) return true
      const member = getSiteMemberUser(user)
      if (!member) return false
      return {
        author: {
          equals: member.id,
        },
      }
    },
  },
  admin: {
    defaultColumns: ['body', 'status', 'livestream', 'author', 'updatedAt'],
    useAsTitle: 'body',
  },
  fields: [
    {
      name: 'livestream',
      type: 'relationship',
      relationTo: 'livestreams',
      required: true,
      index: true,
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      maxDepth: 1,
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
      maxLength: 1000,
    },
    {
      name: 'likeCount',
      type: 'number',
      defaultValue: 0,
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'approved',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      access: {
        create: ({ req: { user } }) => isUsersCollectionAdmin(user),
        update: ({ req: { user } }) => isUsersCollectionAdmin(user),
      },
    },
  ],
  hooks: {
    beforeChange: [forceLivestreamCommentAuthor],
    beforeDelete: [deleteRelatedLivestreamCommentLikes],
  },
  timestamps: true,
}

import type { CollectionConfig } from 'payload'

import { authenticatedSiteMember } from '../../access/authenticatedSiteMember'
import { isUsersCollectionAdmin } from '../../access/isAdminUser'
import { getSiteMemberUser } from '../../access/siteMemberUser'
import { forceLivestreamCommentLikeUser } from './hooks/forceLivestreamCommentLikeUser'
import { preventDuplicateLivestreamCommentLike } from './hooks/preventDuplicateLivestreamCommentLike'
import {
  decrementLivestreamCommentLikeCount,
  incrementLivestreamCommentLikeCount,
} from './hooks/syncLivestreamCommentLikeCount'

export const LivestreamCommentLikes: CollectionConfig = {
  slug: 'livestream-comment-likes',
  admin: {
    hidden: true,
    useAsTitle: 'id',
  },
  access: {
    create: authenticatedSiteMember,
    read: ({ req: { user } }) => Boolean(isUsersCollectionAdmin(user)),
    update: () => false,
    delete: ({ req: { user } }) => {
      if (isUsersCollectionAdmin(user)) return true
      const member = getSiteMemberUser(user)
      if (!member) return false
      return {
        user: {
          equals: member.id,
        },
      }
    },
  },
  fields: [
    {
      name: 'comment',
      type: 'relationship',
      relationTo: 'livestream-comments',
      required: true,
      index: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
  ],
  hooks: {
    beforeValidate: [preventDuplicateLivestreamCommentLike],
    beforeChange: [forceLivestreamCommentLikeUser],
    afterChange: [incrementLivestreamCommentLikeCount],
    afterDelete: [decrementLivestreamCommentLikeCount],
  },
  timestamps: true,
}

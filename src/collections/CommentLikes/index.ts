import type { CollectionConfig } from 'payload'

import { authenticatedSiteMember } from '../../access/authenticatedSiteMember'
import { isUsersCollectionAdmin } from '../../access/isAdminUser'
import { getSiteMemberUser } from '../../access/siteMemberUser'
import { forceCommentLikeUser } from './hooks/forceCommentLikeUser'
import { preventDuplicateCommentLike } from './hooks/preventDuplicateCommentLike'
import { decrementCommentLikeCount, incrementCommentLikeCount } from './hooks/syncCommentLikeCount'

export const CommentLikes: CollectionConfig = {
  slug: 'comment-likes',
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
      relationTo: 'comments',
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
    {
      name: 'reaction',
      type: 'select',
      required: true,
      defaultValue: 'like',
      options: [
        { label: 'Like', value: 'like' },
        { label: 'Love', value: 'love' },
        { label: 'Haha', value: 'haha' },
        { label: 'Wow', value: 'wow' },
        { label: 'Sad', value: 'sad' },
        { label: 'Angry', value: 'angry' },
      ],
    },
  ],
  hooks: {
    beforeValidate: [preventDuplicateCommentLike],
    beforeChange: [forceCommentLikeUser],
    afterChange: [incrementCommentLikeCount],
    afterDelete: [decrementCommentLikeCount],
  },
  timestamps: true,
}

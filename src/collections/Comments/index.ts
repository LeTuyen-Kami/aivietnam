import type { CollectionConfig } from 'payload'
import type { Where } from 'payload'

import { authenticatedSiteMember } from '../../access/authenticatedSiteMember'
import { isUsersCollectionAdmin } from '../../access/isAdminUser'
import { getSiteMemberUser } from '../../access/siteMemberUser'
import { applyCommentModeration } from './hooks/applyCommentModeration'
import { forceCommentAuthor } from './hooks/forceCommentAuthor'

export const Comments: CollectionConfig = {
  slug: 'comments',
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
      if (!member) {
        return { status: { equals: 'approved' } }
      }
      return {
        or: [
          { status: { equals: 'approved' } },
          { author: { equals: member.id } },
        ],
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
    defaultColumns: ['body', 'status', 'post', 'author', 'updatedAt'],
    useAsTitle: 'body',
  },
  fields: [
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'posts',
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
      maxLength: 4000,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'approved',
      admin: {
        description:
          'Thành viên: tự động approved nếu qua blacklist, rejected nếu khớp từ khóa cấm. Pending chỉ dùng khi admin đặt tay.',
      },
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
    {
      name: 'rejectionReason',
      type: 'select',
      options: [{ label: 'Blocked keyword', value: 'blocked_keyword' }],
      admin: {
        readOnly: true,
        description: 'Điền tự động khi nội dung khớp blacklist.',
      },
    },
  ],
  hooks: {
    beforeChange: [forceCommentAuthor, applyCommentModeration],
  },
  timestamps: true,
}

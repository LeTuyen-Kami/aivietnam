import type { CollectionConfig } from 'payload'

import { adminOnly } from '../../access/adminOnly'

export const CommentModerationRules: CollectionConfig = {
  slug: 'comment-moderation-rules',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: adminOnly,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['ruleType', 'keyword', 'blockedUser', 'updatedAt'],
    useAsTitle: 'ruleType',
    description: 'Từ khóa cấm hoặc user bị chặn bình luận.',
  },
  fields: [
    {
      name: 'ruleType',
      type: 'select',
      required: true,
      options: [
        { label: 'Blocked keyword', value: 'blockedKeyword' },
        { label: 'Blocked user', value: 'blockedUser' },
      ],
    },
    {
      name: 'keyword',
      type: 'textarea',
      admin: {
        condition: (data) => data?.ruleType === 'blockedKeyword',
        description:
          'Mỗi dòng một cụm từ cấm. So khớp chuỗi con sau khi chuẩn hóa chữ thường (Enter = tách cụm).',
        rows: 12,
      },
    },
    {
      name: 'blockedUser',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        condition: (data) => data?.ruleType === 'blockedUser',
      },
    },
  ],
  timestamps: true,
}

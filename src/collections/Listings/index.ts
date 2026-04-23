import type { Access, CollectionConfig } from 'payload'

import { slugField } from 'payload'

import { anyone } from '@/access/anyone'
import { authenticatedSiteMember } from '@/access/authenticatedSiteMember'
import { getSiteMemberUser } from '@/access/siteMemberUser'
import { isUsersCollectionAdmin } from '@/access/isAdminUser'
import { slugifyTitle } from '@/utilities/slugify'

const canManageOwnListing: Access = ({ req: { user } }) => {
  if (isUsersCollectionAdmin(user)) return true

  const member = getSiteMemberUser(user)
  if (!member) return false

  return {
    createdBy: {
      equals: member.id,
    },
  }
}

export const Listings: CollectionConfig = {
  slug: 'listings',
  access: {
    create: authenticatedSiteMember,
    delete: canManageOwnListing,
    read: anyone,
    update: canManageOwnListing,
  },
  admin: {
    defaultColumns: [
      'title',
      'listingType',
      'categories',
      'priceLabel',
      'city',
      '_status',
      'updatedAt',
    ],
    useAsTitle: 'title',
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField({
      position: 'sidebar',
      slugify: ({ valueToSlugify }) => slugifyTitle(valueToSlugify),
    }),
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'listing-categories',
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: 'Chọn một hoặc nhiều danh mục cho tin đăng này.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'listingType',
          type: 'select',
          required: true,
          defaultValue: 'job-seeking',
          options: [
            { label: 'Cần việc', value: 'job-seeking' },
            { label: 'Tuyển dụng', value: 'job-offer' },
            { label: 'Dịch vụ', value: 'service' },
            { label: 'Khác', value: 'other' },
          ],
        },
        {
          name: 'priceLabel',
          type: 'text',
          required: true,
          defaultValue: 'Thỏa thuận',
          admin: {
            description: 'Ví dụ: Thỏa thuận, 15 triệu/tháng, 500.000 VNĐ/buổi.',
          },
        },
      ],
    },
    {
      name: 'summary',
      type: 'textarea',
      admin: {
        description: 'Mô tả ngắn hiển thị ở phần mở đầu.',
      },
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
      admin: {
        description: 'Nội dung mô tả chính của tin đăng.',
      },
    },
    {
      name: 'contactPhone',
      type: 'text',
      required: true,
    },
    {
      type: 'collapsible',
      label: 'Đặc điểm tin đăng',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'city',
              type: 'text',
              required: true,
            },
            {
              name: 'district',
              type: 'text',
            },
          ],
        },
        {
          name: 'address',
          type: 'text',
        },
        {
          name: 'packageName',
          type: 'text',
          defaultValue: 'Miễn phí',
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Thông tin liên hệ',
      fields: [
        {
          name: 'contactName',
          type: 'text',
          required: true,
        },
        {
          name: 'supportPhone',
          type: 'text',
        },
        {
          name: 'statusLabel',
          type: 'select',
          defaultValue: 'available',
          options: [
            { label: 'Đang hiển thị', value: 'available' },
            { label: 'Đã ẩn', value: 'hidden' },
            { label: 'Đã chốt', value: 'closed' },
          ],
        },
        {
          name: 'zaloUrl',
          type: 'text',
        },
      ],
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Ảnh đại diện của tin khi hiển thị trong danh sách cập nhật.',
      },
    },
    {
      name: 'gallery',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: {
        description: 'Bộ sưu tập ảnh của tin đăng.',
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      access: {
        create: () => false,
        update: () => false,
      },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        const member = getSiteMemberUser(req.user)

        if (member && data) {
          data.createdBy = member.id
          if (!data.contactName && member.name) data.contactName = member.name
        }

        return data
      },
    ],
  },
  timestamps: true,
}

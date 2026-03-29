import type { GlobalConfig } from 'payload'

import { revalidateGeneralSettings } from './hooks/revalidateGeneralSettings'
import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const GeneralSettings: GlobalConfig = {
  slug: 'general-settings',
  lockDocuments: false,
  label: {
    en: 'General Settings',
    vi: 'Thông tin chung',
  },
  access: {
    read: () => true,
  },
  admin: {
    description: {
      en: 'Configure general site information such as site name, logo, contact details and social links.',
      vi: 'Cấu hình thông tin chung của trang web như tên trang, logo, thông tin liên hệ và mạng xã hội.',
    },
    group: 'Settings',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'siteName',
          type: 'text',
          label: {
            en: 'Site Name',
            vi: 'Tên trang web',
          },
          defaultValue: '',
          admin: {
            width: '50%',
          },
        },
        {
          name: 'siteDescription',
          type: 'textarea',
          label: {
            en: 'Site Description',
            vi: 'Mô tả trang web',
          },
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          label: {
            en: 'Logo',
            vi: 'Logo',
          },
          admin: {
            width: '50%',
          },
        },
        {
          name: 'favicon',
          type: 'upload',
          relationTo: 'media',
          label: {
            en: 'Favicon',
            vi: 'Favicon',
          },
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'contact',
      type: 'group',
      label: {
        en: 'Contact Information',
        vi: 'Thông tin liên hệ',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'email',
              type: 'email',
              label: {
                en: 'Email',
                vi: 'Email',
              },
              admin: {
                width: '50%',
              },
            },
            {
              name: 'phone',
              type: 'text',
              label: {
                en: 'Phone',
                vi: 'Số điện thoại',
              },
              admin: {
                width: '50%',
              },
            },
          ],
        },
        {
          name: 'address',
          type: 'textarea',
          label: {
            en: 'Address',
            vi: 'Địa chỉ',
          },
        },
      ],
    },
    {
      name: 'socialLinks',
      type: 'group',
      label: {
        en: 'Social Media Links',
        vi: 'Mạng xã hội',
      },
      admin: {
        description: {
          en: 'Add your social media profile URLs.',
          vi: 'Thêm đường dẫn đến trang mạng xã hội của bạn.',
        },
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'facebook',
              type: 'text',
              label: 'Facebook',
              admin: {
                width: '50%',
              },
            },
            {
              name: 'twitter',
              type: 'text',
              label: 'Twitter / X',
              admin: {
                width: '50%',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'instagram',
              type: 'text',
              label: 'Instagram',
              admin: {
                width: '50%',
              },
            },
            {
              name: 'linkedin',
              type: 'text',
              label: 'LinkedIn',
              admin: {
                width: '50%',
              },
            },
          ],
        },
        {
          name: 'youtube',
          type: 'text',
          label: 'YouTube',
        },
      ],
    },
    {
      name: 'footerContent',
      type: 'group',
      label: {
        en: 'Footer Content',
        vi: 'Nội dung chân trang',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'content',
              label: {
                en: 'Content',
                vi: 'Nội dung',
              },
              type: 'richText',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
                },
              }),
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'copyright',
              type: 'text',
              label: 'Copyright',
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateGeneralSettings],
  },
}

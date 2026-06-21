import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { link } from '@/fields/link'
import { revalidateHeader } from './hooks/revalidateHeader'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'bannerImage',
      type: 'upload',
      relationTo: 'media',
      label: {
        en: 'Header banner image',
        vi: 'Ảnh banner đầu trang',
      },
    },
    {
      name: 'mobileBannerImage',
      type: 'upload',
      relationTo: 'media',
      label: {
        en: 'Mobile header banner image',
        vi: 'Ảnh banner đầu trang mobile',
      },
      admin: {
        description: {
          en: 'Optional image shown on mobile. Falls back to desktop banner if empty.',
          vi: 'Tuỳ chọn: ảnh hiển thị trên mobile. Nếu để trống sẽ dùng banner desktop.',
        },
      },
    },
    {
      name: 'bannerLink',
      type: 'text',
      label: {
        en: 'Header banner link',
        vi: 'Đường dẫn khi bấm banner',
      },
      admin: {
        description: {
          en: 'Optional URL when users click banner images.',
          vi: 'Tuỳ chọn: đường dẫn khi người dùng bấm banner.',
        },
      },
    },
    {
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 12,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}

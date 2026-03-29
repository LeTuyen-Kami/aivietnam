import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateHeader } from './hooks/revalidateHeader'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
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
      name: 'bannerLink',
      type: 'text',
      label: {
        en: 'Header banner link',
        vi: 'Đường dẫn khi bấm banner',
      },
      admin: {
        description: {
          en: 'Optional URL when users click the banner image.',
          vi: 'Tuỳ chọn: đường dẫn khi người dùng bấm vào banner.',
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

import type { Block } from 'payload'

import { BLOCK_VISIBILITY_OPTIONS } from '@/utilities/blockVisibility'

export const MediaBlock: Block = {
  slug: 'mediaBlock',
  interfaceName: 'MediaBlock',
  fields: [
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'visible',
      type: 'select',
      hasMany: true,
      defaultValue: ['all'],
      options: BLOCK_VISIBILITY_OPTIONS.map((value) => ({
        value,
        label:
          value === 'all'
            ? { en: 'All devices', vi: 'Mọi thiết bị' }
            : value === 'mobile'
              ? { en: 'Mobile', vi: 'Mobile' }
              : value === 'tablet'
                ? { en: 'Tablet', vi: 'Tablet' }
                : { en: 'Desktop', vi: 'Desktop' },
      })),
      label: {
        en: 'Visible on',
        vi: 'Hiển thị trên',
      },
      admin: {
        description: {
          en: 'Choose which screen sizes show this block. Default is all devices. Selecting "All devices" shows everywhere.',
          vi: 'Chọn kích thước màn hình hiển thị block. Mặc định là mọi thiết bị. Chọn "Mọi thiết bị" để hiện ở mọi nơi.',
        },
      },
    },
  ],
}

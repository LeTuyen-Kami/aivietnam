import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const Banner: Block = {
  slug: 'banner',
  fields: [
    {
      name: 'style',
      type: 'select',
      defaultValue: 'info',
      label: { en: 'Style', vi: 'Kiểu' },
      options: [
        { label: { en: 'Info', vi: 'Thông tin' }, value: 'info' },
        { label: { en: 'Warning', vi: 'Cảnh báo' }, value: 'warning' },
        { label: { en: 'Error', vi: 'Lỗi' }, value: 'error' },
        { label: { en: 'Success', vi: 'Thành công' }, value: 'success' },
      ],
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
      label: false,
      required: true,
    },
  ],
  interfaceName: 'BannerBlock',
}

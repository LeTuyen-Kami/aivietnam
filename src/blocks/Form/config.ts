import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const FormBlock: Block = {
  slug: 'formBlock',
  interfaceName: 'FormBlock',
  fields: [
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      label: { en: 'Form', vi: 'Biểu mẫu' },
      required: true,
    },
    {
      name: 'enableIntro',
      type: 'checkbox',
      label: { en: 'Enable Intro Content', vi: 'Bật nội dung mở đầu' },
    },
    {
      name: 'introContent',
      type: 'richText',
      admin: {
        condition: (_, { enableIntro }) => Boolean(enableIntro),
      },
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
          ]
        },
      }),
      label: { en: 'Intro Content', vi: 'Nội dung mở đầu' },
    },
  ],
  graphQL: {
    singularName: 'FormBlock',
  },
  labels: {
    plural: { en: 'Form Blocks', vi: 'Khối biểu mẫu' },
    singular: { en: 'Form Block', vi: 'Khối biểu mẫu' },
  },
}

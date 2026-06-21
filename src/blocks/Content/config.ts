import type { Block, Field } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { link } from '@/fields/link'

const columnFields: Field[] = [
  {
    name: 'size',
    type: 'select',
    defaultValue: 'oneThird',
    label: { en: 'Size', vi: 'Kích thước' },
    options: [
      {
        label: { en: 'One Third', vi: 'Một phần ba' },
        value: 'oneThird',
      },
      {
        label: { en: 'Half', vi: 'Một nửa' },
        value: 'half',
      },
      {
        label: { en: 'Two Thirds', vi: 'Hai phần ba' },
        value: 'twoThirds',
      },
      {
        label: { en: 'Full', vi: 'Toàn bộ' },
        value: 'full',
      },
    ],
  },
  {
    name: 'richText',
    type: 'richText',
    editor: lexicalEditor({
      features: ({ rootFeatures }) => {
        return [
          ...rootFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ]
      },
    }),
    label: false,
  },
  {
    name: 'enableLink',
    type: 'checkbox',
    label: { en: 'Enable Link', vi: 'Bật liên kết' },
  },
  link({
    overrides: {
      admin: {
        condition: (_data, siblingData) => {
          return Boolean(siblingData?.enableLink)
        },
      },
    },
  }),
]

export const Content: Block = {
  slug: 'content',
  interfaceName: 'ContentBlock',
  fields: [
    {
      name: 'columns',
      type: 'array',
      admin: {
        initCollapsed: true,
      },
      labels: {
        plural: { en: 'Columns', vi: 'Các cột' },
        singular: { en: 'Column', vi: 'Cột' },
      },
      fields: columnFields,
    },
  ],
}

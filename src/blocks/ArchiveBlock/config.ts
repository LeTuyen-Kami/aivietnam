import type { Block } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const Archive: Block = {
  slug: 'archive',
  interfaceName: 'ArchiveBlock',
  fields: [
    {
      name: 'introContent',
      type: 'richText',
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
    {
      name: 'populateBy',
      type: 'select',
      defaultValue: 'collection',
      label: { en: 'Populate by', vi: 'Lấy dữ liệu theo' },
      options: [
        {
          label: { en: 'Collection', vi: 'Theo collection' },
          value: 'collection',
        },
        {
          label: { en: 'Individual Selection', vi: 'Chọn từng mục' },
          value: 'selection',
        },
      ],
    },
    {
      name: 'relationTo',
      type: 'select',
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'collection',
      },
      defaultValue: 'posts',
      label: { en: 'Collections To Show', vi: 'Collection hiển thị' },
      options: [
        {
          label: { en: 'Posts', vi: 'Bài viết' },
          value: 'posts',
        },
      ],
    },
    {
      name: 'categories',
      type: 'relationship',
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'collection',
      },
      hasMany: true,
      label: { en: 'Categories To Show', vi: 'Danh mục hiển thị' },
      relationTo: 'categories',
    },
    {
      name: 'limit',
      type: 'number',
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'collection',
        step: 1,
      },
      defaultValue: 10,
      label: { en: 'Limit', vi: 'Số lượng tối đa' },
    },
    {
      name: 'selectedDocs',
      type: 'relationship',
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'selection',
      },
      hasMany: true,
      label: { en: 'Selection', vi: 'Mục đã chọn' },
      relationTo: ['posts'],
    },
  ],
  labels: {
    plural: { en: 'Archives', vi: 'Kho lưu trữ' },
    singular: { en: 'Archive', vi: 'Kho lưu trữ' },
  },
}

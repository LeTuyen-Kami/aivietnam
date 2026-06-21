import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { anyone } from '../access/anyone'
import { staff } from '../access/staff'
import sharp from 'sharp'

export const Media: CollectionConfig = {
  slug: 'media',
  folders: true,
  admin: {
    defaultColumns: ['filename', 'url', 'alt', 'updatedAt'],
  },
  access: {
    create: staff,
    delete: staff,
    read: anyone,
    update: staff,
  },
  fields: [
    {
      name: 'url',
      type: 'text',
      admin: {
        readOnly: true,
        components: {
          Cell: '@/components/Media/MediaUrlCell#MediaUrlCell',
        },
      },
    },
    {
      name: 'alt',
      type: 'text',
      //required: true,
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
  ],
  upload: {
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    disableLocalStorage: false,
    formatOptions: {
      format: 'webp',
      options: {
        quality: 70,
        effort: 2,
      },
    },
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
        formatOptions: {
          format: 'webp',
          options: {
            quality: 70,
            effort: 2,
          },
        },
      },
      {
        name: 'large',
        width: 1400,
        formatOptions: {
          format: 'webp',
          options: {
            quality: 70,
            effort: 2,
          },
        },
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'center',
        formatOptions: {
          format: 'webp',
          options: {
            quality: 70,
            effort: 2,
          },
        },
      },
    ],
  },
}

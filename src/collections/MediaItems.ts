import type { CollectionConfig } from 'payload'

import { slugField } from 'payload'

import { adminOnly } from '../access/adminOnly'
import { authenticatedOrPublished } from '../access/authenticatedOrPublished'
import { defaultLexical } from '../fields/defaultLexical'
import { slugifyTitle } from '../utilities/slugify'

export const MediaItems: CollectionConfig = {
  slug: 'media-items',
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data || typeof data !== 'object') return data

        const itemData = data as { title?: unknown; slug?: unknown }
        const title = typeof itemData.title === 'string' ? itemData.title.trim() : ''
        const slug = typeof itemData.slug === 'string' ? itemData.slug.trim() : ''

        if (title && !slug) {
          itemData.slug = slugifyTitle(title)
        }

        return data
      },
    ],
  },
  access: {
    admin: ({ req }) => adminOnly({ req }) === true,
    create: adminOnly,
    delete: adminOnly,
    read: authenticatedOrPublished,
    update: adminOnly,
  },
  defaultSort: '-publishedAt',
  defaultPopulate: {
    title: true,
    slug: true,
    type: true,
    summary: true,
    thumbnail: true,
    image: true,
    categories: true,
    publishedAt: true,
    sourceName: true,
    speaker: true,
    narrator: true,
    channelName: true,
    seriesName: true,
    episodeNumber: true,
    audioDuration: true,
  },
  admin: {
    defaultColumns: ['title', 'type', 'publishedAt', 'updatedAt'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Podcast', value: 'podcast' },
        { label: 'Video', value: 'video' },
        { label: 'Image', value: 'image' },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'summary',
              type: 'textarea',
            },
            {
              name: 'content',
              type: 'richText',
              editor: defaultLexical,
              required: false,
            },
            {
              name: 'thumbnail',
              type: 'upload',
              relationTo: 'media',
              filterOptions: {
                mimeType: {
                  contains: 'image',
                },
              },
              admin: {
                description: 'Thumbnail tùy chọn cho card hoặc preview.',
              },
            },
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              filterOptions: {
                mimeType: {
                  contains: 'image',
                },
              },
              admin: {
                condition: (data) => data?.type === 'image',
                description: 'Ảnh chính cho item loại image.',
              },
            },
            {
              name: 'podcast',
              type: 'group',
              admin: {
                condition: (data) => data?.type === 'podcast',
              },
              fields: [
                {
                  name: 'audioMedia',
                  type: 'upload',
                  relationTo: 'media',
                  filterOptions: {
                    mimeType: {
                      contains: 'audio',
                    },
                  },
                },
                {
                  name: 'audioUrl',
                  type: 'text',
                  admin: {
                    description: 'Direct audio URL, ví dụ file .mp3.',
                  },
                },
                {
                  name: 'speaker',
                  type: 'text',
                },
                {
                  name: 'narrator',
                  type: 'text',
                },
                {
                  name: 'channelName',
                  type: 'text',
                },
                {
                  name: 'seriesName',
                  type: 'text',
                },
                {
                  name: 'episodeNumber',
                  type: 'text',
                },
                {
                  name: 'audioDuration',
                  type: 'text',
                },
              ],
              validate: (value) => {
                if (!value || typeof value !== 'object') return 'Podcast data is required'
                const podcastValue = value as { audioMedia?: unknown; audioUrl?: unknown }
                if (podcastValue.audioMedia || podcastValue.audioUrl) return true
                return 'Podcast requires audio media or audio URL'
              },
            },
            {
              name: 'video',
              type: 'group',
              admin: {
                condition: (data) => data?.type === 'video',
              },
              fields: [
                {
                  name: 'sourceType',
                  type: 'select',
                  options: [
                    { label: 'Upload', value: 'upload' },
                    { label: 'YouTube URL', value: 'youtube' },
                    { label: 'Direct URL', value: 'direct' },
                  ],
                },
                {
                  name: 'videoMedia',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    condition: (_data, siblingData) => siblingData?.sourceType === 'upload',
                  },
                  filterOptions: {
                    mimeType: {
                      contains: 'video',
                    },
                  },
                },
                {
                  name: 'youtubeUrl',
                  type: 'text',
                  admin: {
                    condition: (_data, siblingData) => siblingData?.sourceType === 'youtube',
                  },
                },
                {
                  name: 'videoUrl',
                  type: 'text',
                  admin: {
                    condition: (_data, siblingData) => siblingData?.sourceType === 'direct',
                  },
                },
              ],
              validate: (value) => {
                if (!value || typeof value !== 'object') return 'Video data is required'
                const videoValue = value as {
                  videoMedia?: unknown
                  youtubeUrl?: unknown
                  videoUrl?: unknown
                }
                if (videoValue.videoMedia || videoValue.youtubeUrl || videoValue.videoUrl)
                  return true
                return 'Video requires uploaded media, YouTube URL, or direct URL'
              },
            },
          ],
        },
        {
          label: 'Meta',
          fields: [
            {
              name: 'categories',
              type: 'relationship',
              relationTo: 'media-categories' as never,
              hasMany: true,
            },
            {
              name: 'sourceName',
              type: 'text',
            },
            {
              name: 'creatorName',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    slugField({
      slugify: ({ valueToSlugify }) => slugifyTitle(valueToSlugify),
    }),
  ],
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}

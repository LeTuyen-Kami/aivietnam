import type { Block } from 'payload'

export const MediaHubTriptych: Block = {
  slug: 'mediaHubTriptych',
  dbName: 'mht',
  interfaceName: 'MediaHubTriptychBlock',
  labels: {
    singular: {
      en: 'Media hub — 3 columns',
      vi: 'Khu vực media — 3 cột',
    },
    plural: {
      en: 'Media hub — 3 columns',
      vi: 'Các khối media 3 cột',
    },
  },
  fields: [
    {
      type: 'group',
      name: 'podcastColumn',
      label: {
        en: 'Podcasts',
        vi: 'Podcasts',
      },
      fields: [
        {
          name: 'sectionTitle',
          type: 'text',
          label: {
            en: 'Section title',
            vi: 'Tiêu đề mục',
          },
          defaultValue: 'Podcasts Radio 📻',
        },
        {
          name: 'items',
          type: 'relationship',
          relationTo: 'media-items',
          hasMany: true,
          minRows: 1,
          maxRows: 5,
          required: true,
          filterOptions: {
            type: {
              equals: 'podcast',
            },
          },
          label: {
            en: 'Podcast items',
            vi: 'Media item podcast',
          },
        },
      ],
    },
    {
      type: 'group',
      name: 'videoColumn',
      label: {
        en: 'Video',
        vi: 'Video',
      },
      fields: [
        {
          name: 'sectionTitle',
          type: 'text',
          label: {
            en: 'Section title',
            vi: 'Tiêu đề mục',
          },
          defaultValue: 'Video',
        },
        {
          name: 'featured',
          type: 'relationship',
          relationTo: 'media-items',
          required: true,
          filterOptions: {
            type: {
              equals: 'video',
            },
          },
          label: {
            en: 'Featured video item',
            vi: 'Media item video nổi bật',
          },
        },
        {
          name: 'gridItems',
          type: 'relationship',
          relationTo: 'media-items',
          hasMany: true,
          maxRows: 4,
          minRows: 0,
          filterOptions: {
            type: {
              equals: 'video',
            },
          },
          label: {
            en: 'Video grid items',
            vi: 'Media item video cho lưới',
          },
        },
      ],
    },
    {
      type: 'group',
      name: 'photoColumn',
      label: {
        en: 'Photo corner',
        vi: 'Góc ảnh',
      },
      fields: [
        {
          name: 'sectionTitle',
          type: 'text',
          label: {
            en: 'Section title',
            vi: 'Tiêu đề mục',
          },
          defaultValue: 'Góc ảnh 📷',
        },
        {
          name: 'featured',
          type: 'relationship',
          relationTo: 'media-items',
          required: true,
          filterOptions: {
            type: {
              equals: 'image',
            },
          },
          label: {
            en: 'Featured image item',
            vi: 'Media item ảnh nổi bật',
          },
        },
        {
          name: 'bottomItems',
          type: 'relationship',
          relationTo: 'media-items',
          hasMany: true,
          maxRows: 2,
          minRows: 0,
          filterOptions: {
            type: {
              equals: 'image',
            },
          },
          label: {
            en: 'Bottom image items',
            vi: 'Media item ảnh hàng dưới',
          },
        },
      ],
    },
  ],
}

import type { CollectionConfig } from 'payload'

import {
  AlignFeature,
  BlockquoteFeature,
  BlocksFeature,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  IndentFeature,
  InlineToolbarFeature,
  LinkFeature,
  lexicalEditor,
  RelationshipFeature,
  TextStateFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { Banner } from '../../blocks/Banner/config'
import { Code } from '../../blocks/Code/config'
import { EnhancedMediaBlock } from '../../blocks/EnhancedMediaBlock/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { populateAuthors } from './hooks/populateAuthors'
import { revalidateDelete, revalidatePost } from './hooks/revalidatePost'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { slugField } from 'payload'

import { slugifyTitle } from '../../utilities/slugify'

export const Posts: CollectionConfig<'posts'> = {
  slug: 'posts',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  // This config controls what's populated by default when a post is referenced
  // https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
  // Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'posts'>
  defaultPopulate: {
    title: true,
    slug: true,
    categories: true,
    meta: {
      image: true,
      description: true,
    },
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'posts',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'posts',
        req,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'heroImage',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'footerImage',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description:
                  'Ảnh cuối trang chi tiết. Để trống sẽ dùng ảnh mặc định trong General Settings → Default post page images (nếu có).',
              },
            },
            {
              name: 'footerImageHref',
              type: 'text',
              admin: {
                description:
                  'Link khi nhấn ảnh cuối trang (tùy chọn). Nếu không set mà dùng ảnh mặc định global, link lấy từ global.',
              },
            },
            {
              name: 'sidebarAdImage',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description:
                  'Ảnh quảng cáo sidebar. Để trống sẽ dùng ảnh mặc định trong General Settings (nếu có).',
              },
            },
            {
              name: 'sidebarAdHref',
              type: 'text',
              admin: {
                description:
                  'Link quảng cáo sidebar (tùy chọn). Nếu không set mà dùng ảnh mặc định global, link lấy từ global.',
              },
            },
            {
              name: 'content',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                    BlocksFeature({ blocks: [Banner, Code, MediaBlock, EnhancedMediaBlock] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                    // Link - internal (posts, pages) + external URLs
                    LinkFeature({
                      enabledCollections: ['posts', 'pages'],
                    }),
                    // Blockquote
                    BlockquoteFeature(),
                    // Upload - chèn ảnh trực tiếp vào nội dung
                    UploadFeature({
                      collections: {
                        media: {
                          fields: [
                            {
                              name: 'caption',
                              type: 'text',
                              admin: {
                                description: 'Chú thích cho ảnh',
                              },
                            },
                          ],
                        },
                      },
                    }),
                    // Relationship - link đến bài viết/trang khác trong editor
                    RelationshipFeature({
                      enabledCollections: ['posts', 'pages'],
                    }),
                    // Căn chỉnh văn bản (trái, giữa, phải)
                    AlignFeature(),
                    // Thụt lề
                    IndentFeature(),
                    // Màu chữ & highlight
                    TextStateFeature(),
                    // Bảng (experimental)
                    EXPERIMENTAL_TableFeature(),
                  ]
                },
              }),
              label: false,
              required: true,
            },
          ],
          label: 'Content',
        },
        {
          fields: [
            {
              name: 'relatedPosts',
              type: 'relationship',
              admin: {
                position: 'sidebar',
              },
              filterOptions: ({ id }) => {
                return {
                  id: {
                    not_in: [id],
                  },
                }
              },
              hasMany: true,
              relationTo: 'posts',
            },
            {
              name: 'categories',
              type: 'relationship',
              admin: {
                position: 'sidebar',
              },
              hasMany: true,
              relationTo: 'categories',
            },
          ],
          label: 'Meta',
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            {
              name: 'seoImageChecker',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/components/SeoImageChecker#SeoImageChecker',
                },
              },
            },
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
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
    {
      name: 'authors',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      hasMany: true,
      relationTo: 'users',
    },
    // This field is only used to populate the user data via the `populateAuthors` hook
    // This is because the `user` collection has access control locked to protect user privacy
    // GraphQL will also not return mutated user data that differs from the underlying schema
    {
      name: 'populatedAuthors',
      type: 'array',
      access: {
        update: () => false,
      },
      admin: {
        disabled: true,
        readOnly: true,
      },
      fields: [
        {
          name: 'id',
          type: 'text',
        },
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    {
      name: 'views',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Số lượt xem bài viết',
        readOnly: true,
      },
    },
    slugField({
      slugify: ({ valueToSlugify }) => slugifyTitle(valueToSlugify),
    }),
  ],
  hooks: {
    afterChange: [revalidatePost],
    afterRead: [populateAuthors],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100, // We set this interval for optimal live preview
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}

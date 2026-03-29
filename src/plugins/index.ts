import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { searchPlugin } from '@payloadcms/plugin-search'
import { Plugin } from 'payload'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { searchFields } from '@/search/fieldOverrides'
import { beforeSyncWithSearch } from '@/search/beforeSync'

import { Page, Post } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

const generateTitle: GenerateTitle<Post | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Payload Website Template` : 'Payload Website Template'
}

const generateURL: GenerateURL<Post | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

export const plugins: Plugin[] = [
  redirectsPlugin({
    collections: ['pages', 'posts'],
    overrides: {
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description: 'You will need to rebuild the website when changing this field.',
              },
            }
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  nestedDocsPlugin({
    collections: ['categories'],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formOverrides: {
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
  }),
  searchPlugin({
    collections: ['posts'],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields]
      },
    },
  }),
  /**
   * MCP endpoint: `/api/mcp`. Clients authenticate with a Bearer token from Admin → MCP → API Keys.
   * Omitting `users` avoids exposing user accounts via MCP. Enable writes only when needed and on the API key.
   */
  mcpPlugin({
    collections: {
      posts: {
        description: 'Blog posts and articles',
        enabled: { find: true, create: false, update: true, delete: false },
      },
      pages: {
        description: 'Site pages and landing content',
        enabled: { find: true, create: false, update: true, delete: false },
      },
      media: {
        description: 'Uploaded images and files',
        enabled: { find: true, create: false, update: false, delete: false },
      },
      categories: {
        description: 'Post categories',
        enabled: { find: true, create: false, update: false, delete: false },
      },
      forms: {
        description: 'Form builder forms',
        enabled: { find: true, create: true, update: true, delete: true },
      },
      'form-submissions': {
        description: 'Form submission records (newsletter/API; website posts via /api/form-submissions)',
        enabled: { find: true, create: true, update: false, delete: false },
      },
    },
    globals: {
      header: {
        description: 'Main navigation and header',
        enabled: { find: true, update: false },
      },
      footer: {
        description: 'Footer links and content',
        enabled: { find: true, update: false },
      },
      'general-settings': {
        description: 'Site-wide general settings',
        enabled: { find: true, update: false },
      },
    },
    mcp: {
      handlerOptions: {
        maxDuration: 120,
      },
      serverOptions: {
        serverInfo: {
          name: 'aivietnam-payload',
          version: '1.0.0',
        },
      },
    },
  }),
]

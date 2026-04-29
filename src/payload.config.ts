import { postgresAdapter } from '@payloadcms/db-postgres'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { en } from '@payloadcms/translations/languages/en'
import { vi } from '@payloadcms/translations/languages/vi'
import { Categories } from './collections/Categories'
import { CommentLikes } from './collections/CommentLikes'
import { CommentModerationRules } from './collections/CommentModerationRules'
import { Comments } from './collections/Comments'
import { ListingCategories } from './collections/ListingCategories'
import { Listings } from './collections/Listings'
import { LivestreamChatEventReceipts } from './collections/LivestreamChatEventReceipts'
import { LivestreamChatMessages } from './collections/LivestreamChatMessages'
import { Livestreams } from './collections/Livestreams'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { Footer } from './Footer/config'
import { GeneralSettings } from './GeneralSettings/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { getServerSideURL } from './utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const mediaStorageProvider = process.env.MEDIA_STORAGE_PROVIDER?.toLowerCase()
const r2Endpoint = process.env.R2_ENDPOINT ?? ''
const r2PublicBaseURL = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, '')
const r2StorageEnabled = Boolean(
  mediaStorageProvider !== 'local' &&
  process.env.R2_BUCKET &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  r2Endpoint,
)

export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeDashboard: ['@/components/BeforeDashboard'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },

    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: lexicalEditor({}),
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // This project points at a shared remote Postgres instance.
    // Disable dev-time schema push so all shape changes go through explicit migrations.
    push: true,
  }),
  collections: [
    Pages,
    Posts,
    Media,
    // MediaGifs,
    Categories,
    ListingCategories,
    Listings,
    Users,
    CommentModerationRules,
    Comments,
    CommentLikes,
    Livestreams,
    LivestreamChatMessages,
    LivestreamChatEventReceipts,
  ],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer, GeneralSettings],
  upload: {
    limits: {
      fileSize: 30 * 1024 * 1024, // 30MB
    },
  },
  plugins: [
    ...plugins,
    ...(r2StorageEnabled
      ? [
          s3Storage({
            collections: {
              [Media.slug]: r2PublicBaseURL
                ? {
                    generateFileURL: ({
                      filename,
                      prefix,
                    }: {
                      filename: string
                      prefix?: string
                    }) => {
                      const normalizedPrefix = prefix ? `${prefix.replace(/\/$/, '')}/` : ''
                      return `${r2PublicBaseURL}/${normalizedPrefix}${filename}`
                    },
                  }
                : true,
              // [MediaGifs.slug]: r2PublicBaseURL
              //   ? {
              //       generateFileURL: ({
              //         filename,
              //         prefix,
              //       }: {
              //         filename: string
              //         prefix?: string
              //       }) => {
              //         const normalizedPrefix = prefix ? `${prefix.replace(/\/$/, '')}/` : ''
              //         return `${r2PublicBaseURL}/${normalizedPrefix}${filename}`
              //       },
              //     }
              //   : true,
            },
            // clientUploads: true,
            bucket: process.env.R2_BUCKET || '',
            config: {
              region: 'auto',
              endpoint: r2Endpoint,
              credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
              },
            },
          }),
        ]
      : []),
  ],
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        const secret = process.env.CRON_SECRET
        if (!secret) return false

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${secret}`
      },
    },
    tasks: [],
  },
  i18n: {
    supportedLanguages: { en, vi },
    fallbackLanguage: 'en',
  },
})

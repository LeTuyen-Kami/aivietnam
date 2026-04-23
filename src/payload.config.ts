import { postgresAdapter } from '@payloadcms/db-postgres'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { CommentModerationRules } from './collections/CommentModerationRules'
import { CommentLikes } from './collections/CommentLikes'
import { Comments } from './collections/Comments'
import { Livestreams } from './collections/Livestreams'
import { LivestreamChatMessages } from './collections/LivestreamChatMessages'
import { LivestreamChatEventReceipts } from './collections/LivestreamChatEventReceipts'
import { ListingCategories } from './collections/ListingCategories'
import { Listings } from './collections/Listings'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { Footer } from './Footer/config'
import { GeneralSettings } from './GeneralSettings/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
import { vi } from '@payloadcms/translations/languages/vi'
import { en } from '@payloadcms/translations/languages/en'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

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
    push: false,
  }),
  collections: [
    Pages,
    Posts,
    Media,
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
  plugins: [
    ...plugins,
    vercelBlobStorage({
      collections: {
        [Media.slug]: true,
      },
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
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

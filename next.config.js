import { withPayload } from '@payloadcms/next/withPayload'

import redirects from './redirects.js'

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined || process.env.__NEXT_PRIVATE_ORIGIN || 'http://localhost:3000'

const VIETNAM_PROVINCES_API_ORIGIN = 'https://provinces.open-api.vn'

// In local dev the database (Neon) is shared with the remote server, but the
// uploaded media files live only on that server's disk. Proxy media file
// requests to it so relative `/api/media/file/*` URLs resolve to the real files
// instead of 500-ing on the local disk. Guarded to dev so production (which
// serves its own files) is unaffected.
const DEV_MEDIA_ORIGIN =
  process.env.NEXT_PUBLIC_ENV === 'dev' ? process.env.NEXT_PUBLIC_SERVER_URL : undefined

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL /* 'https://example.com' */].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', ''),
        }
      }),
      // Local dev: render ảnh phục vụ từ ổ đĩa của remote server (HTTP). Chỉ bật ở
      // dev để production không chứa host HTTP không mã hoá. Đồng bộ với gate của
      // media proxy bên dưới (NEXT_PUBLIC_ENV === 'dev').
      ...(process.env.NEXT_PUBLIC_ENV === 'dev'
        ? [
            {
              hostname: '180.93.2.175',
              protocol: 'http',
              port: '3000',
            },
          ]
        : []),
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  reactStrictMode: true,
  async rewrites() {
    return {
      // beforeFiles runs before the Payload `/api/media/file/*` route, so the
      // request is proxied to the remote server (where the files exist) instead
      // of being handled locally.
      beforeFiles: DEV_MEDIA_ORIGIN
        ? [
            {
              source: '/api/media/file/:path*',
              destination: `${DEV_MEDIA_ORIGIN}/api/media/file/:path*`,
            },
          ]
        : [],
      afterFiles: [
        {
          source: '/api/v2/:path*',
          destination: `${VIETNAM_PROVINCES_API_ORIGIN}/api/v2/:path*`,
        },
      ],
    }
  },
  redirects,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })

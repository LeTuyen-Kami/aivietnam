import type { Metadata } from 'next'
import type { GeneralSetting, Media } from '@/payload-types'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import React from 'react'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()
  const generalSettings: GeneralSetting = await getCachedGlobal('general-settings', 1)()
  const faviconMedia =
    typeof generalSettings?.favicon === 'object' ? (generalSettings.favicon as Media) : null
  const faviconHref = faviconMedia?.url || '/favicon.ico'
  const faviconType = faviconMedia?.mimeType || 'image/x-icon'

  return (
    <html className={cn(GeistMono.variable)} lang="vi" suppressHydrationWarning>
      <head>
        <InitTheme />
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link crossOrigin="" href="https://fonts.gstatic.com" rel="preconnect" />
        <link
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400..700&family=Merriweather:ital,opsz,wght@0,18..144,300..900;1,18..144,300..900&display=swap"
          rel="stylesheet"
        />
        <link href={faviconHref} rel="icon" type={faviconType} />
        <link href={faviconHref} rel="shortcut icon" type={faviconType} />
        <link href={faviconHref} rel="apple-touch-icon" />
      </head>
      <body>
        <Providers>
          <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          />

          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    creator: '@payloadcms',
  },
}

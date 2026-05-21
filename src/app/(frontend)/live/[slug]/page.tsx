import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { getPublicStreamEnvStatus } from '@/lib/stream/publicClientEnv'
import type { Livestream } from '@/payload-types'
import { ViewerClient } from './Viewer.client'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

function resolveViewerDisplayName(user: unknown): string {
  if (!user || typeof user !== 'object') return 'Khách'

  const record = user as Record<string, unknown>
  const name = typeof record.name === 'string' ? record.name.trim() : ''
  const email = typeof record.email === 'string' ? record.email.trim() : ''

  return name || email || 'Khách'
}

function resolveViewerId(user: unknown, slug: string): string {
  if (user && typeof user === 'object') {
    const record = user as Record<string, unknown>
    const id = record.id
    if (typeof id === 'string' || typeof id === 'number') return String(id)
  }

  return `guest-${slug}`
}

function resolveViewerEmail(user: unknown): string | null {
  if (!user || typeof user !== 'object') return null
  const value = (user as Record<string, unknown>).email
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

export default async function ViewerPage({ params }: Args) {
  const { slug = '' } = await params
  let decodedSlug = ''
  try {
    decodedSlug = decodeURIComponent(slug)
  } catch {
    notFound()
  }

  if (!decodedSlug) notFound()

  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: await headers() })
  const result = await payload.find({
    collection: 'livestreams',
    depth: 0,
    limit: 1,
    pagination: false,
    overrideAccess: false,
    ...(user ? { user } : {}),
    where: {
      slug: {
        equals: decodedSlug,
      },
    },
  })

  const livestream = result.docs[0] as Livestream | undefined
  if (!livestream) notFound()

  const streamEnv = getPublicStreamEnvStatus()

  return (
    <main className="min-h-[100dvh] bg-black text-white">
      <ViewerClient
        livestream={livestream}
        streamApiKey={streamEnv.apiKey}
        streamSetupMessage={streamEnv.isConfigured ? null : streamEnv.setupMessage}
        streamUser={{
          id: resolveViewerId(user, decodedSlug),
          name: resolveViewerDisplayName(user),
          email: resolveViewerEmail(user),
        }}
      />
    </main>
  )
}

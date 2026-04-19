import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'

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
  if (!user || typeof user !== 'object') return 'Member'

  const record = user as Record<string, unknown>
  const name = typeof record.name === 'string' ? record.name.trim() : ''
  const email = typeof record.email === 'string' ? record.email.trim() : ''

  return name || email || 'Member'
}

function resolveViewerEmail(user: unknown): string | null {
  if (!user || typeof user !== 'object') return null
  const value = (user as Record<string, unknown>).email
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

export default async function ViewerPage({ params }: Args) {
  const { slug = '' } = await params
  const decodedSlug = decodeURIComponent(slug)

  if (!decodedSlug) notFound()

  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: await headers() })
  const encodedSlug = encodeURIComponent(decodedSlug)

  if (!user) {
    redirect(`/?auth=login_required&returnTo=${encodeURIComponent(`/live/${encodedSlug}`)}`)
  }

  const result = await payload.find({
    collection: 'livestreams',
    depth: 0,
    limit: 1,
    pagination: false,
    overrideAccess: false,
    user,
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
    <main className="container py-10">
      <ViewerClient
        livestream={livestream}
        streamApiKey={streamEnv.apiKey}
        streamSetupMessage={streamEnv.isConfigured ? null : streamEnv.setupMessage}
        streamUser={{
          id: String(user.id),
          name: resolveViewerDisplayName(user),
          email: resolveViewerEmail(user),
        }}
      />
    </main>
  )
}

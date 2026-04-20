import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'

import { isUsersCollectionAdmin } from '@/access/isAdminUser'
import { getPublicStreamEnvStatus } from '@/lib/stream/publicClientEnv'
import type { Livestream } from '@/payload-types'
import { BroadcasterClient } from './Broadcaster.client'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function BroadcasterPage({ params }: Args) {
  const { slug = '' } = await params
  const decodedSlug = decodeURIComponent(slug)
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: await headers() })

  if (!user) {
    redirect(`/?auth=login_required&returnTo=${encodeURIComponent(`/broadcaster/${decodedSlug}`)}`)
  }

  if (!isUsersCollectionAdmin(user)) {
    return (
      <main className="container py-12 sm:py-16">
        <section className="mx-auto max-w-lg rounded-2xl border border-border/80 bg-card p-8 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
          <h1 className="text-2xl font-semibold tracking-tight">Không có quyền</h1>
          <p className="mt-3 text-pretty text-muted-foreground">
            Chỉ tài khoản quản trị mới có thể mở trang phát sóng livestream.
          </p>
        </section>
      </main>
    )
  }

  const result = await payload.find({
    collection: 'livestreams',
    depth: 0,
    limit: 1,
    pagination: false,
    overrideAccess: false,
    user,
    where: {
      slug: { equals: decodedSlug },
    },
  })

  const livestream = result.docs[0] as Livestream | undefined
  if (!livestream) notFound()
  const streamEnv = getPublicStreamEnvStatus()

  return (
    <main className="container max-w-6xl py-8 sm:py-12">
      <BroadcasterClient
        livestream={livestream}
        streamApiKey={streamEnv.apiKey}
        streamSetupMessage={streamEnv.isConfigured ? null : streamEnv.setupMessage}
        streamUser={{
          id: String(user.id),
          name: user.email,
        }}
      />
    </main>
  )
}

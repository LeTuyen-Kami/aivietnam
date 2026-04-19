import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'

import { isUsersCollectionAdmin } from '@/access/isAdminUser'
import type { Livestream } from '@/payload-types'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function BroadcasterPage({ params }: Args) {
  const routeIntent = '/broadcaster/[slug]'
  const { slug = '' } = await params
  const decodedSlug = decodeURIComponent(slug)
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: await headers() })

  if (!user) {
    redirect(`/?auth=login_required&returnTo=${encodeURIComponent(`/broadcaster/${decodedSlug}`)}`)
  }

  if (!isUsersCollectionAdmin(user)) {
    return (
      <main className="container py-16">
        <section className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-6">
          <h1 className="text-2xl font-semibold">Access denied</h1>
          <p className="mt-3 text-muted-foreground">
            Only admins can broadcast livestreams.
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

  return (
    <main className="container py-10">
      <section className="rounded-lg border border-border bg-card p-6">
        <h1 className="text-2xl font-semibold">Broadcaster</h1>
        <p className="mt-1 text-xs text-muted-foreground">Route: {routeIntent}</p>
        <p className="mt-2 text-muted-foreground">
          Livestream is ready to start.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">Session: {livestream.title}</p>
      </section>
    </main>
  )
}

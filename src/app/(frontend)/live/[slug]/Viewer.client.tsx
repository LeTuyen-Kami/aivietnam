'use client'

import type { Livestream } from '@/payload-types'

type ViewerClientProps = {
  livestream: Livestream
  streamApiKey: string
  streamSetupMessage: string | null
  streamUser: {
    id: string
    name: string
    email: string | null
  }
}

export function ViewerClient({ livestream, streamSetupMessage, streamUser }: ViewerClientProps) {
  return (
    <section className="mx-auto max-w-3xl rounded-lg border border-border bg-card p-6">
      <h1 className="text-2xl font-semibold">{livestream.title}</h1>
      {streamSetupMessage ? (
        <p className="mt-3 text-sm text-muted-foreground">{streamSetupMessage}</p>
      ) : null}
      <p className="mt-4 text-sm text-muted-foreground">Signed in as {streamUser.name}</p>
    </section>
  )
}

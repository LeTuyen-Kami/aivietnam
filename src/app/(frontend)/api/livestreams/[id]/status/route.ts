import config from '@payload-config'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let decodedSlug = ''
  try {
    decodedSlug = decodeURIComponent(id ?? '')
  } catch {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
  }

  if (!decodedSlug) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
  }

  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

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

  const livestream = result.docs[0]
  if (!livestream) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(
    {
      slug: decodedSlug,
      status: livestream.status,
      callId: livestream.callId ?? null,
      callType: livestream.callType ?? null,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  )
}

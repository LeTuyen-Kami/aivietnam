import config from '@payload-config'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { getSiteMemberUser } from '@/access/siteMemberUser'
import { getLivestreamChatHostStreamUserId } from '@/lib/stream/chatServer'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

type ReplayMessage = {
  id: string
  body: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  author: {
    id: string
    name: string | null
  }
  reactionLikeCount: number
}

export async function GET(req: NextRequest) {
  const slugRaw = req.nextUrl.searchParams.get('slug') ?? ''
  const slug = slugRaw.trim()
  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  }

  const limitParam = Number(req.nextUrl.searchParams.get('limit') ?? DEFAULT_LIMIT)
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.isFinite(limitParam) ? limitParam : DEFAULT_LIMIT),
  )

  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })
  const member = getSiteMemberUser(user)

  const livestreamResult = await payload.find({
    collection: 'livestreams',
    depth: 0,
    limit: 1,
    pagination: false,
    ...(member ? { user: member } : {}),
    overrideAccess: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  const livestream = livestreamResult.docs[0]
  if (!livestream) {
    return NextResponse.json({ error: 'Livestream not found' }, { status: 404 })
  }

  const mirrored = await payload.find({
    collection: 'livestream-chat-messages',
    depth: 0,
    limit,
    overrideAccess: true,
    sort: '-createdAtStream',
    where: {
      livestream: {
        equals: livestream.id,
      },
    },
  })

  const docs = mirrored.docs.map((doc) => {
    const row: ReplayMessage = {
      id: doc.streamMessageId,
      body: doc.text ?? '',
      createdAt:
        typeof doc.createdAtStream === 'string'
          ? doc.createdAtStream
          : new Date(doc.createdAtStream).toISOString(),
      updatedAt:
        typeof doc.updatedAtStream === 'string'
          ? doc.updatedAtStream
          : new Date(doc.updatedAtStream).toISOString(),
      deletedAt: doc.deletedAt ? new Date(doc.deletedAt).toISOString() : null,
      author: {
        id: doc.authorStreamUserId,
        name: doc.authorName ?? null,
      },
      reactionLikeCount: doc.reactionLikeCount ?? 0,
    }
    return row
  })

  const hostStreamUserId = await getLivestreamChatHostStreamUserId(slug)

  return NextResponse.json({ docs, hostStreamUserId })
}

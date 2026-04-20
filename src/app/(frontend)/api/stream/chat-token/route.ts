import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

import { getSiteMemberUser } from '@/access/siteMemberUser'
import { streamChatChannelIdFromSlug, streamChatChannelType } from '@/lib/stream/chatChannel'
import {
  ensureLivestreamChatChannel,
  getStreamChatServerClient,
  isStreamChatEnabled,
} from '@/lib/stream/chatServer'
import { streamDisplayName, streamUserIdFromPayloadUser } from '@/lib/stream/user'

export async function POST(req: NextRequest) {
  if (!isStreamChatEnabled()) {
    return NextResponse.json({ error: 'Stream chat is disabled' }, { status: 503 })
  }

  let json: { slug?: unknown }
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const slug = typeof json.slug === 'string' ? json.slug.trim() : ''
  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  }

  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })
  const member = getSiteMemberUser(user)
  if (!member) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const livestreamResult = await payload.find({
    collection: 'livestreams',
    depth: 0,
    limit: 1,
    pagination: false,
    user: member,
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

  const client = getStreamChatServerClient()
  const streamUserId = streamUserIdFromPayloadUser(member)
  const displayName = streamDisplayName(member)

  await client.upsertUser({
    id: streamUserId,
    name: displayName,
  })

  const ensured = await ensureLivestreamChatChannel({
    slug,
    createdById: streamUserId,
    name: livestream.title ?? slug,
  })
  const channelType = streamChatChannelType()
  const channelId = streamChatChannelIdFromSlug(slug)
  const sec = Number(process.env.STREAM_TOKEN_VALIDITY_SECONDS) || 3600
  const token = client.createToken(streamUserId, Math.floor(Date.now() / 1000) + sec)

  return NextResponse.json({
    token,
    expiresAt: new Date(Date.now() + sec * 1000).toISOString(),
    apiKey: process.env.STREAM_CHAT_API_KEY,
    user: {
      id: streamUserId,
      name: displayName,
    },
    channel: {
      channelType,
      channelId,
      channelCid: ensured.channelCid,
    },
  })
}

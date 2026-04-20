import config from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

import { isStreamChatEnabled } from '@/lib/stream/chatServer'
import { verifyStreamChatWebhookSignature } from '@/lib/stream/chatWebhook'

type StreamWebhookMessage = {
  id?: string
  text?: string
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
  user?: {
    id?: string
    name?: string
  }
  reaction_counts?: Record<string, number> | null
}

type StreamWebhookEvent = {
  type?: string
  created_at?: string
  cid?: string
  channel_id?: string
  channel_type?: string
  message?: StreamWebhookMessage
}

async function resolveLivestreamIdBySlug(payload: Awaited<ReturnType<typeof getPayload>>, slug: string) {
  if (!slug) return null
  const result = await payload.find({
    collection: 'livestreams',
    depth: 0,
    limit: 1,
    pagination: false,
    overrideAccess: true,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs[0]?.id ?? null
}

function isHandledType(type: string): boolean {
  return (
    type === 'message.new' ||
    type === 'message.updated' ||
    type === 'message.deleted' ||
    type === 'reaction.new' ||
    type === 'reaction.deleted' ||
    type === 'reaction.updated'
  )
}

export async function POST(req: NextRequest) {
  if (!isStreamChatEnabled()) {
    return NextResponse.json({ error: 'Stream chat is disabled' }, { status: 503 })
  }

  const rawBody = await req.text()
  const signature = req.headers.get('x-signature')
  if (!verifyStreamChatWebhookSignature({ signature, rawBody })) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = (JSON.parse(rawBody) as StreamWebhookEvent) ?? {}
  const eventType = event.type ?? ''
  if (!isHandledType(eventType)) {
    return NextResponse.json({ ok: true, ignored: true })
  }

  const payload = await getPayload({ config })
  const eventId = req.headers.get('x-webhook-id') ?? `${eventType}:${event.message?.id ?? 'unknown'}:${event.created_at ?? ''}`

  const existingReceipt = await payload.find({
    collection: 'livestream-chat-event-receipts',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      eventId: {
        equals: eventId,
      },
    },
  })
  if (existingReceipt.docs[0]) {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  const message = event.message
  const streamMessageId = message?.id?.trim() ?? ''
  if (!streamMessageId) {
    return NextResponse.json({ ok: true, ignored: true })
  }
  const safeMessage = message as StreamWebhookMessage

  const channelType = event.channel_type ?? ''
  const channelId = event.channel_id ?? ''
  const channelCid = event.cid ?? (channelType && channelId ? `${channelType}:${channelId}` : '')
  const livestreamId = await resolveLivestreamIdBySlug(payload, channelId)

  const existingMessage = await payload.find({
    collection: 'livestream-chat-messages',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      streamMessageId: {
        equals: streamMessageId,
      },
    },
  })

  const reactionLikeCount =
    typeof safeMessage.reaction_counts?.like === 'number' ? safeMessage.reaction_counts.like : 0

  const data = {
    streamMessageId,
    channelCid,
    channelType,
    channelId,
    livestream: livestreamId ?? undefined,
    authorStreamUserId: safeMessage.user?.id ?? 'unknown',
    authorName: safeMessage.user?.name ?? null,
    text: safeMessage.text ?? '',
    reactionLikeCount,
    createdAtStream: safeMessage.created_at ?? event.created_at ?? new Date().toISOString(),
    updatedAtStream:
      safeMessage.updated_at ?? safeMessage.created_at ?? event.created_at ?? new Date().toISOString(),
    deletedAt:
      eventType === 'message.deleted'
        ? (safeMessage.deleted_at ??
          safeMessage.updated_at ??
          event.created_at ??
          new Date().toISOString())
        : null,
    rawPayload: event,
  }

  if (existingMessage.docs[0]) {
    await payload.update({
      collection: 'livestream-chat-messages',
      id: existingMessage.docs[0].id,
      data,
      depth: 0,
      overrideAccess: true,
    })
  } else {
    await payload.create({
      collection: 'livestream-chat-messages',
      data,
      depth: 0,
      overrideAccess: true,
    })
  }

  await payload.create({
    collection: 'livestream-chat-event-receipts',
    data: {
      eventId,
      eventType,
      channelCid,
      processedAt: new Date().toISOString(),
      rawPayload: event,
    },
    depth: 0,
    overrideAccess: true,
  })

  return NextResponse.json({ ok: true })
}

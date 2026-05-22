import config from '@payload-config'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { canBroadcastLivestream } from '@/access/isAdminUser'
import { ensureLivestreamChatChannel, isStreamChatEnabled } from '@/lib/stream/chatServer'
import { getStreamServerClient } from '@/lib/stream/server'
import { streamUserIdFromPayloadUser } from '@/lib/stream/user'

function normalizeCallId(docId: number, callId: string | null | undefined): string {
  const trimmed = callId?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : String(docId)
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const livestreamId = Number(id)
  if (!livestreamId || Number.isNaN(livestreamId)) {
    return NextResponse.json({ error: 'Invalid livestream id' }, { status: 400 })
  }

  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canBroadcastLivestream(user))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const livestream = await payload.findByID({
    collection: 'livestreams',
    id: livestreamId,
    user,
    overrideAccess: false,
    depth: 0,
  })

  if (livestream.status === 'ended') {
    return NextResponse.json(
      { error: 'Phiên livestream đã kết thúc. Tạo phòng mới để phát lại.' },
      { status: 410 },
    )
  }

  const callType = livestream.callType?.trim() || 'livestream'
  const callId = normalizeCallId(livestreamId, livestream.callId)
  const streamUserId = streamUserIdFromPayloadUser(user)
  const client = getStreamServerClient() as unknown as {
    video: { call: (type: string, id: string) => any }
    generateCallToken: (input: {
      user_id: string
      call_cids: string[]
      role?: string
      validity_in_seconds?: number
    }) => string
  }

  const call = client.video.call(callType, callId)
  await call.getOrCreate({
    data: {
      created_by_id: streamUserId,
    },
  })

  if (typeof call.updateCallMembers === 'function') {
    await call.updateCallMembers({
      update_members: [
        {
          user_id: streamUserId,
          role: 'admin',
        },
      ],
    })
  }

  let joinedAsPublisher = false
  if (typeof call.queryMembers === 'function') {
    const membersResult = await call.queryMembers({
      filter_conditions: {
        user_id: { $eq: streamUserId },
      },
    })
    joinedAsPublisher = Array.isArray(membersResult?.members)
      ? membersResult.members.some(
          (member: { user_id?: string }) => member.user_id === streamUserId,
        )
      : false
  }

  const publisherJoinConfirmed = joinedAsPublisher
  if (!publisherJoinConfirmed) {
    return NextResponse.json({ error: 'Publisher join not confirmed' }, { status: 409 })
  }

  let chatChannelCid: string | null = null
  if (isStreamChatEnabled() && livestream.slug) {
    const ensuredChat = await ensureLivestreamChatChannel({
      slug: livestream?.slug,
      createdById: streamUserId,
      name: livestream.title ?? livestream.slug,
    })
    chatChannelCid = ensuredChat.channelCid
  }

  const liveDoc = await payload.update({
    collection: 'livestreams',
    id: livestreamId,
    data: {
      callId,
      callType,
      status: 'live',
      chatChannelCid: chatChannelCid ?? undefined,
    },
    user,
    overrideAccess: false,
    depth: 0,
  })

  const sec = Number(process.env.STREAM_TOKEN_VALIDITY_SECONDS) || 3600
  const callCid = `${callType}:${callId}`
  const token = client.generateCallToken({
    user_id: streamUserId,
    role: 'admin',
    call_cids: [callCid],
    validity_in_seconds: sec,
  })

  return NextResponse.json({
    id: liveDoc.id,
    callType,
    callId,
    callCid,
    chatChannelCid,
    token,
    expiresAt: new Date(Date.now() + sec * 1000).toISOString(),
    status: 'live',
    joinedAsPublisher,
    publisherJoinConfirmed,
  })
}

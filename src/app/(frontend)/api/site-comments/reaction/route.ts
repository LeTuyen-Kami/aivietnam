import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'
import type { Where } from 'payload'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { getSiteMemberUser } from '@/access/siteMemberUser'
import { ensureGuestId, setGuestCookie } from '@/utilities/guestId'

type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'

const ALLOWED_REACTIONS = new Set<ReactionType>(['like', 'love', 'haha', 'wow', 'sad', 'angry'])

export async function POST(req: NextRequest) {
  let json: { commentId?: unknown; reaction?: unknown }
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const commentId = typeof json.commentId === 'number' ? json.commentId : Number(json.commentId)
  const reaction = typeof json.reaction === 'string' ? (json.reaction as ReactionType) : null

  if (!commentId || Number.isNaN(commentId)) {
    return NextResponse.json({ error: 'commentId is required' }, { status: 400 })
  }
  if (!reaction || !ALLOWED_REACTIONS.has(reaction)) {
    return NextResponse.json({ error: 'reaction is invalid' }, { status: 400 })
  }

  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  const member = getSiteMemberUser(user)
  const guest = member ? null : ensureGuestId(req)
  const actorWhere: Where = member
    ? { user: { equals: member.id } }
    : { guestId: { equals: guest!.guestId } }
  const actorData = member ? { user: member.id } : { guestId: guest!.guestId }

  const comment = await payload.findByID({
    collection: 'comments',
    id: commentId,
    depth: 0,
    overrideAccess: member ? false : true,
    ...(member ? { user: member } : {}),
  })
  if (!comment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const payloadReq = await createLocalReq(member ? { user: member } : {}, payload)

  const existing = await payload.find({
    collection: 'comment-likes',
    where: {
      and: [{ comment: { equals: commentId } }, actorWhere],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const current = existing.docs[0]
  if (!current) {
    await payload.create({
      collection: 'comment-likes',
      data: { comment: commentId, reaction, ...actorData },
      req: payloadReq,
      overrideAccess: member ? false : true,
      depth: 0,
    })
  } else if (current.reaction === reaction) {
    await payload.delete({
      collection: 'comment-likes',
      id: current.id,
      req: payloadReq,
      overrideAccess: true,
    })
  } else {
    await payload.delete({
      collection: 'comment-likes',
      id: current.id,
      req: payloadReq,
      overrideAccess: true,
    })
    await payload.create({
      collection: 'comment-likes',
      data: { comment: commentId, reaction, ...actorData },
      req: payloadReq,
      overrideAccess: member ? false : true,
      depth: 0,
    })
  }

  const reactions = await payload.find({
    collection: 'comment-likes',
    where: { comment: { equals: commentId } },
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })

  const summary: Partial<Record<ReactionType, number>> = {}
  let myReaction: ReactionType | null = null
  reactions.docs.forEach((row) => {
    const type = (row.reaction ?? 'like') as ReactionType
    summary[type] = (summary[type] ?? 0) + 1
    if (member) {
      const userId = typeof row.user === 'object' && row.user !== null ? row.user.id : row.user
      if (userId === member.id) myReaction = type
    } else if (guest && (row as { guestId?: string | null }).guestId === guest.guestId) {
      myReaction = type
    }
  })

  const res = NextResponse.json({
    myReaction,
    reactionSummary: summary,
  })
  if (guest?.isNew) setGuestCookie(res, guest.guestId)
  return res
}

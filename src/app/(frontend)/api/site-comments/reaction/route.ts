import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { getSiteMemberUser } from '@/access/siteMemberUser'

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
  if (!member) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const comment = await payload.findByID({
    collection: 'comments',
    id: commentId,
    depth: 0,
    overrideAccess: false,
    user: member,
  })
  if (!comment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const payloadReq = await createLocalReq({ user: member }, payload)

  const existing = await payload.find({
    collection: 'comment-likes',
    where: {
      and: [{ comment: { equals: commentId } }, { user: { equals: member.id } }],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const current = existing.docs[0]
  if (!current) {
    await payload.create({
      collection: 'comment-likes',
      data: { comment: commentId, user: member.id, reaction },
      req: payloadReq,
      overrideAccess: false,
      depth: 0,
    })
  } else if (current.reaction === reaction) {
    await payload.delete({
      collection: 'comment-likes',
      id: current.id,
      req: payloadReq,
      overrideAccess: false,
    })
  } else {
    await payload.delete({
      collection: 'comment-likes',
      id: current.id,
      req: payloadReq,
      overrideAccess: false,
    })
    await payload.create({
      collection: 'comment-likes',
      data: { comment: commentId, user: member.id, reaction },
      req: payloadReq,
      overrideAccess: false,
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
    const userId = typeof row.user === 'object' && row.user !== null ? row.user.id : row.user
    if (userId === member.id) myReaction = type
  })

  return NextResponse.json({
    myReaction,
    reactionSummary: summary,
  })
}

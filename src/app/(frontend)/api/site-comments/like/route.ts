import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import type { Comment } from '@/payload-types'
import { getSiteMemberUser } from '@/access/siteMemberUser'
import { getCommentIfVisibleForUser } from '@/utilities/commentVisibility'
import { ensureGuestId, setGuestCookie } from '@/utilities/guestId'
import { clientIpFromHeaders, rateLimit } from '@/utilities/rateLimit'
import type { Where } from 'payload'

export async function POST(req: NextRequest) {
  if (!rateLimit(`comment-like:${clientIpFromHeaders(req)}`, 60, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let json: { commentId?: unknown }
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const commentId = typeof json.commentId === 'number' ? json.commentId : Number(json.commentId)
  if (!commentId || Number.isNaN(commentId)) {
    return NextResponse.json({ error: 'commentId is required' }, { status: 400 })
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

  const comment = await getCommentIfVisibleForUser(commentId, user, payload)
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

  const hadLike = Boolean(existing.docs[0])

  if (hadLike && existing.docs[0]) {
    await payload.delete({
      collection: 'comment-likes',
      id: existing.docs[0].id,
      req: payloadReq,
      overrideAccess: true,
    })
  } else {
    await payload.create({
      collection: 'comment-likes',
      data: {
        comment: commentId,
        reaction: 'like',
        ...actorData,
      },
      draft: false,
      req: payloadReq,
      overrideAccess: member ? false : true,
      depth: 0,
    })
  }

  const updated = (await payload.findByID({
    collection: 'comments',
    id: commentId,
    depth: 0,
    overrideAccess: true,
  })) as Comment

  const res = NextResponse.json({
    liked: !hadLike,
    likeCount: updated.likeCount ?? 0,
  })
  if (guest?.isNew) setGuestCookie(res, guest.guestId)
  return res
}

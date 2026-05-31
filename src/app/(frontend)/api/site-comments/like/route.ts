import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'
import type { PayloadRequest } from 'payload'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import type { Comment } from '@/payload-types'
import { isUsersCollectionAdmin } from '@/access/isAdminUser'
import { getSiteMemberUser } from '@/access/siteMemberUser'
import { ensureGuestId, setGuestCookie } from '@/utilities/guestId'
import type { Where } from 'payload'

async function getCommentIfVisibleForUser(
  commentId: number,
  user: PayloadRequest['user'],
  payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<Comment | null> {
  const comment = (await payload.findByID({
    collection: 'comments',
    id: commentId,
    depth: 0,
    overrideAccess: true,
  })) as Comment | null

  if (!comment) return null

  if (isUsersCollectionAdmin(user)) return comment

  const member = getSiteMemberUser(user)
  const authorId = typeof comment.author === 'object' && comment.author ? comment.author.id : comment.author

  if (member) {
    if (comment.status === 'approved' || authorId === member.id) return comment
    return null
  }

  // Guests can only act on publicly visible (approved) comments.
  if (comment.status === 'approved') return comment
  return null
}

export async function POST(req: NextRequest) {
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

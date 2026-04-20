import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'
import type { PayloadRequest } from 'payload'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { isUsersCollectionAdmin } from '@/access/isAdminUser'
import { getSiteMemberUser } from '@/access/siteMemberUser'

type LivestreamCommentDoc = {
  id: number
  status: string
  author: number | { id: number } | null
  likeCount?: number | null
}

function getAuthorId(author: LivestreamCommentDoc['author']): number | null {
  if (typeof author === 'number') return author
  if (author && typeof author === 'object' && typeof author.id === 'number') return author.id
  return null
}

async function getCommentIfVisibleForUser(
  commentId: number,
  user: PayloadRequest['user'],
  payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<LivestreamCommentDoc | null> {
  const comment = (await payload.findByID({
    collection: 'livestream-comments',
    id: commentId,
    depth: 0,
    overrideAccess: true,
  })) as LivestreamCommentDoc | null

  if (!comment) return null
  if (isUsersCollectionAdmin(user)) return comment

  const member = getSiteMemberUser(user)
  if (!member) return null

  const authorId = getAuthorId(comment.author)
  if (comment.status === 'approved' || authorId === member.id) return comment
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
  if (!member) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const comment = await getCommentIfVisibleForUser(commentId, user, payload)
  if (!comment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const payloadReq = await createLocalReq({ user: member }, payload)

  const existing = await payload.find({
    collection: 'livestream-comment-likes',
    where: {
      and: [{ comment: { equals: commentId } }, { user: { equals: member.id } }],
    },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })

  const hadLike = Boolean(existing.docs[0])
  if (hadLike && existing.docs[0]) {
    await payload.delete({
      collection: 'livestream-comment-likes',
      id: existing.docs[0].id,
      req: payloadReq,
      overrideAccess: false,
    })
  } else {
    await payload.create({
      collection: 'livestream-comment-likes',
      data: {
        comment: commentId,
        user: member.id,
      },
      req: payloadReq,
      draft: false,
      depth: 0,
      overrideAccess: false,
    })
  }

  const updated = (await payload.findByID({
    collection: 'livestream-comments',
    id: commentId,
    depth: 0,
    overrideAccess: true,
  })) as LivestreamCommentDoc

  return NextResponse.json({
    liked: !hadLike,
    likeCount: updated.likeCount ?? 0,
  })
}

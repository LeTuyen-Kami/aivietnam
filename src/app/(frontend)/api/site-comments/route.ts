import config from '@payload-config'
import { APIError, createLocalReq, getPayload } from 'payload'
import type { DataFromCollectionSlug } from 'payload'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import type { Comment, User } from '@/payload-types'
import { isUsersCollectionAdmin } from '@/access/isAdminUser'
import { getSiteMemberUser } from '@/access/siteMemberUser'
import type { Where } from 'payload'

type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'

type ReactionSummary = Partial<Record<ReactionType, number>>

function toCommentId(comment: Comment['parentComment'] | number | null | undefined): number | null {
  if (typeof comment === 'number') return comment
  if (comment && typeof comment === 'object' && 'id' in comment && typeof comment.id === 'number') {
    return comment.id
  }
  return null
}

function serializeComment(c: Comment, myReaction: ReactionType | null, reactions: ReactionSummary) {
  const author =
    typeof c.author === 'object' && c.author !== null
      ? { id: (c.author as User).id, name: (c.author as User).name ?? null }
      : null
  return {
    id: c.id,
    body: c.body,
    status: c.status,
    createdAt: c.createdAt,
    author,
    likeCount: c.likeCount ?? 0,
    parentCommentId: toCommentId(c.parentComment),
    myReaction,
    reactionSummary: reactions,
    likedByMe: myReaction === 'like',
  }
}

const DEFAULT_PAGE_SIZE = 15
const MAX_PAGE_SIZE = 50

export async function GET(req: NextRequest) {
  const postIdParam = req.nextUrl.searchParams.get('postId')
  const postId = postIdParam ? Number(postIdParam) : NaN
  if (!postIdParam || Number.isNaN(postId)) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 })
  }

  const pageParam = req.nextUrl.searchParams.get('page')
  const limitParam = req.nextUrl.searchParams.get('limit')
  const sortParam = req.nextUrl.searchParams.get('sort')
  const page = Math.max(1, pageParam ? Number(pageParam) || 1 : 1)
  const limitRaw = limitParam ? Number(limitParam) : DEFAULT_PAGE_SIZE
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : DEFAULT_PAGE_SIZE))

  const sort =
    sortParam === 'popular'
      ? ('-likeCount,-createdAt' as const)
      : ('-createdAt' as const)

  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  const filters: Where[] = [{ post: { equals: postId } }, { parentComment: { exists: false } }]
  if (!isUsersCollectionAdmin(user)) {
    const member = getSiteMemberUser(user)
    if (member) {
      filters.push({
        or: [{ status: { equals: 'approved' } }, { author: { equals: member.id } }],
      })
    } else {
      filters.push({ status: { equals: 'approved' } })
    }
  }

  const listWhere = { and: filters }

  const [pageResult, approvedTotalResult] = await Promise.all([
    payload.find({
      collection: 'comments',
      where: listWhere,
      depth: 1,
      sort,
      limit,
      page,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'comments',
      where: {
        and: [{ post: { equals: postId } }, { status: { equals: 'approved' } }],
      },
      limit: 1,
      pagination: true,
      overrideAccess: true,
    }),
  ])

  const { docs, totalDocs, totalPages, hasNextPage, hasPrevPage } = pageResult

  const parentIds = docs.map((c) => c.id)

  const repliesResult =
    parentIds.length > 0
      ? await payload.find({
          collection: 'comments',
          where: {
            and: [{ post: { equals: postId } }, { parentComment: { in: parentIds } }, ...filters.slice(2)],
          },
          depth: 1,
          sort: 'createdAt',
          limit: 200,
          overrideAccess: true,
        })
      : { docs: [] as Comment[] }

  const visibleComments = [...docs, ...repliesResult.docs]
  const allIds = visibleComments.map((c) => c.id)
  const member = getSiteMemberUser(user)

  const reactionDocs =
    allIds.length > 0
      ? await payload.find({
          collection: 'comment-likes',
          where: { comment: { in: allIds } },
          limit: Math.max(allIds.length * 10, 200),
          depth: 0,
          overrideAccess: true,
        })
      : { docs: [] as Array<{ comment: number | { id: number }; reaction?: ReactionType; user: number | { id: number } }> }

  const reactionSummaryByComment = new Map<number, ReactionSummary>()
  const myReactionByComment = new Map<number, ReactionType>()

  reactionDocs.docs.forEach((row) => {
    const commentId =
      typeof row.comment === 'object' && row.comment !== null ? (row.comment as { id: number }).id : row.comment
    if (typeof commentId !== 'number') return
    const reaction = (row.reaction ?? 'like') as ReactionType
    const next = { ...(reactionSummaryByComment.get(commentId) ?? {}) }
    next[reaction] = (next[reaction] ?? 0) + 1
    reactionSummaryByComment.set(commentId, next)

    if (member) {
      const userId = typeof row.user === 'object' && row.user !== null ? row.user.id : row.user
      if (userId === member.id) {
        myReactionByComment.set(commentId, reaction)
      }
    }
  })

  const repliesByParent = new Map<number, Comment[]>()
  repliesResult.docs.forEach((reply) => {
    const parentId = toCommentId(reply.parentComment)
    if (parentId == null) return
    const current = repliesByParent.get(parentId) ?? []
    current.push(reply)
    repliesByParent.set(parentId, current)
  })

  return NextResponse.json({
    sort: sortParam === 'popular' ? 'popular' : 'newest',
    docs: docs.map((c) => {
      const comment = c as Comment
      const replies = (repliesByParent.get(comment.id) ?? []).map((reply) =>
        serializeComment(
          reply,
          myReactionByComment.get(reply.id) ?? null,
          reactionSummaryByComment.get(reply.id) ?? {},
        ),
      )

      return {
        ...serializeComment(
          comment,
          myReactionByComment.get(comment.id) ?? null,
          reactionSummaryByComment.get(comment.id) ?? {},
        ),
        replies,
      }
    }),
    totalDocs,
    page,
    limit,
    totalPages,
    hasNextPage,
    hasPrevPage,
    approvedCount: approvedTotalResult.totalDocs,
  })
}

export async function POST(req: NextRequest) {
  let json: { postId?: unknown; body?: unknown; parentCommentId?: unknown }
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const postId = typeof json.postId === 'number' ? json.postId : Number(json.postId)
  const body = typeof json.body === 'string' ? json.body.trim() : ''
  const parentCommentId =
    json.parentCommentId == null
      ? null
      : typeof json.parentCommentId === 'number'
        ? json.parentCommentId
        : Number(json.parentCommentId)

  if (!postId || Number.isNaN(postId)) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 })
  }
  if (!body) {
    return NextResponse.json({ error: 'body is required' }, { status: 400 })
  }
  if (parentCommentId != null && Number.isNaN(parentCommentId)) {
    return NextResponse.json({ error: 'parentCommentId is invalid' }, { status: 400 })
  }

  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  const member = getSiteMemberUser(user)
  if (!member) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const post = await payload.findByID({
    collection: 'posts',
    id: postId,
    depth: 0,
    overrideAccess: true,
  })
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  if (parentCommentId != null) {
    const parent = await payload.findByID({
      collection: 'comments',
      id: parentCommentId,
      depth: 0,
      overrideAccess: true,
    })
    if (!parent || parent.post !== postId) {
      return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
    }
    if (toCommentId(parent.parentComment) != null) {
      return NextResponse.json({ error: 'Only 2 comment levels are allowed' }, { status: 400 })
    }
  }

  const payloadReq = await createLocalReq({ user: member }, payload)

  try {
    const doc = await payload.create({
      collection: 'comments',
      data: {
        post: postId,
        body,
        ...(parentCommentId != null ? { parentComment: parentCommentId } : {}),
      } as DataFromCollectionSlug<'comments'>,
      draft: false,
      req: payloadReq,
      overrideAccess: false,
      depth: 1,
    })

    return NextResponse.json({
      doc: serializeComment(doc as Comment, null, {}),
    })
  } catch (e) {
    if (e instanceof APIError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    const message = e instanceof Error ? e.message : 'Failed to create comment'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

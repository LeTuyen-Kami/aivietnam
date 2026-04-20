import config from '@payload-config'
import { APIError, createLocalReq, getPayload } from 'payload'
import type { DataFromCollectionSlug } from 'payload'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { getSiteMemberUser } from '@/access/siteMemberUser'

const DEFAULT_LIMIT = 30
const MAX_LIMIT = 80

type SerializedComment = {
  id: number
  body: string
  status: string
  createdAt: string
  author: { id: number; name: string | null } | null
  likeCount: number
  likedByMe: boolean
}

function relationId(value: unknown): number | null {
  if (typeof value === 'number') return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id?: unknown }).id
    return typeof id === 'number' ? id : null
  }
  return null
}

function relationName(value: unknown): string | null {
  if (typeof value === 'object' && value !== null && 'name' in value) {
    const name = (value as { name?: unknown }).name
    return typeof name === 'string' ? name : null
  }
  return null
}

function serializeComment(doc: Record<string, unknown>, likedByMe: boolean): SerializedComment {
  const author = doc.author
  return {
    id: relationId(doc.id) ?? (doc.id as number),
    body: typeof doc.body === 'string' ? doc.body : '',
    status: typeof doc.status === 'string' ? doc.status : 'approved',
    createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : new Date().toISOString(),
    author:
      relationId(author) != null
        ? {
            id: relationId(author) as number,
            name: relationName(author),
          }
        : null,
    likeCount: typeof doc.likeCount === 'number' ? doc.likeCount : 0,
    likedByMe,
  }
}

export async function GET(req: NextRequest) {
  const slugRaw = req.nextUrl.searchParams.get('slug') ?? ''
  const slug = slugRaw.trim()
  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  }

  const limitParam = Number(req.nextUrl.searchParams.get('limit') ?? DEFAULT_LIMIT)
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number.isFinite(limitParam) ? limitParam : DEFAULT_LIMIT))

  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })
  const member = getSiteMemberUser(user)
  if (!member) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const livestreamResult = await payload.find({
    collection: 'livestreams',
    where: {
      slug: {
        equals: slug,
      },
    },
    depth: 0,
    limit: 1,
    pagination: false,
    user: member,
    overrideAccess: false,
  })

  const livestream = livestreamResult.docs[0]
  if (!livestream) {
    return NextResponse.json({ error: 'Livestream not found' }, { status: 404 })
  }

  const commentsResult = await payload.find({
    collection: 'livestream-comments',
    where: {
      and: [{ livestream: { equals: livestream.id } }, { status: { equals: 'approved' } }],
    },
    depth: 1,
    limit,
    sort: '-createdAt',
    user: member,
    overrideAccess: false,
  })

  const commentIds = commentsResult.docs
    .map((doc) => relationId(doc.id))
    .filter((id): id is number => typeof id === 'number')

  let likedIds = new Set<number>()
  if (commentIds.length > 0) {
    const likes = await payload.find({
      collection: 'livestream-comment-likes',
      where: {
        and: [{ comment: { in: commentIds } }, { user: { equals: member.id } }],
      },
      depth: 0,
      limit: Math.max(commentIds.length, limit),
      overrideAccess: true,
    })

    likedIds = new Set(
      likes.docs
        .map((row) => relationId(row.comment))
        .filter((id): id is number => typeof id === 'number'),
    )
  }

  return NextResponse.json({
    docs: commentsResult.docs.map((doc) =>
      serializeComment(doc as unknown as Record<string, unknown>, likedIds.has(doc.id)),
    ),
  })
}

export async function POST(req: NextRequest) {
  let json: { slug?: unknown; body?: unknown }
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const slug = typeof json.slug === 'string' ? json.slug.trim() : ''
  const body = typeof json.body === 'string' ? json.body.trim() : ''

  if (!slug) return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  if (!body) return NextResponse.json({ error: 'body is required' }, { status: 400 })

  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })
  const member = getSiteMemberUser(user)
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const livestreamResult = await payload.find({
    collection: 'livestreams',
    where: {
      slug: {
        equals: slug,
      },
    },
    depth: 0,
    limit: 1,
    pagination: false,
    user: member,
    overrideAccess: false,
  })
  const livestream = livestreamResult.docs[0]
  if (!livestream) {
    return NextResponse.json({ error: 'Livestream not found' }, { status: 404 })
  }

  const payloadReq = await createLocalReq({ user: member }, payload)

  try {
    const doc = await payload.create({
      collection: 'livestream-comments',
      data: {
        livestream: livestream.id,
        author: member.id,
        body,
        status: 'approved',
      } as DataFromCollectionSlug<'livestream-comments'>,
      req: payloadReq,
      draft: false,
      depth: 1,
      overrideAccess: false,
    })

    return NextResponse.json({
      doc: serializeComment(doc as unknown as Record<string, unknown>, false),
    })
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}

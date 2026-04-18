import config from '@payload-config'
import { APIError, createLocalReq, getPayload } from 'payload'
import type { DataFromCollectionSlug } from 'payload'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import type { Comment, User } from '@/payload-types'
import { isUsersCollectionAdmin } from '@/access/isAdminUser'
import { getSiteMemberUser } from '@/access/siteMemberUser'
import type { Where } from 'payload'

function serializeComment(c: Comment) {
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
  const page = Math.max(1, pageParam ? Number(pageParam) || 1 : 1)
  const limitRaw = limitParam ? Number(limitParam) : DEFAULT_PAGE_SIZE
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : DEFAULT_PAGE_SIZE))

  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  const filters: Where[] = [{ post: { equals: postId } }]
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
      sort: '-createdAt',
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

  return NextResponse.json({
    docs: docs.map((c) => serializeComment(c as Comment)),
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
  let json: { postId?: unknown; body?: unknown }
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const postId = typeof json.postId === 'number' ? json.postId : Number(json.postId)
  const body = typeof json.body === 'string' ? json.body.trim() : ''

  if (!postId || Number.isNaN(postId)) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 })
  }
  if (!body) {
    return NextResponse.json({ error: 'body is required' }, { status: 400 })
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

  const payloadReq = await createLocalReq({ user: member }, payload)

  try {
    const doc = await payload.create({
      collection: 'comments',
      data: {
        post: postId,
        body,
      } as DataFromCollectionSlug<'comments'>,
      draft: false,
      req: payloadReq,
      overrideAccess: false,
      depth: 1,
    })

    return NextResponse.json({ doc: serializeComment(doc as Comment) })
  } catch (e) {
    if (e instanceof APIError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    const message = e instanceof Error ? e.message : 'Failed to create comment'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

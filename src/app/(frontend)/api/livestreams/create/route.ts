import config from '@payload-config'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { APIError, ValidationError, getPayload } from 'payload'

import { isUsersCollectionAdmin } from '@/access/isAdminUser'
import { ensureUniqueLivestreamSlug } from '@/utilities/ensureUniqueLivestreamSlug'
import { slugifyTitle } from '@/utilities/slugify'

function toIsoOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isUsersCollectionAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let json: {
    title?: unknown
    slug?: unknown
    description?: unknown
    scheduledAt?: unknown
    coverImage?: unknown
  }

  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const title = typeof json.title === 'string' ? json.title.trim() : ''
  const slugInput = typeof json.slug === 'string' ? json.slug.trim() : ''
  const normalizedSlug = slugifyTitle(slugInput) ?? ''
  const description = typeof json.description === 'string' ? json.description.trim() : ''
  const scheduledAt = toIsoOrNull(json.scheduledAt)
  const coverImage =
    typeof json.coverImage === 'number'
      ? json.coverImage
      : typeof json.coverImage === 'string' && json.coverImage.trim().length > 0
        ? Number(json.coverImage)
        : null

  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  if (!normalizedSlug) {
    return NextResponse.json({ error: 'slug is invalid' }, { status: 400 })
  }

  let uniqueSlug: string
  try {
    uniqueSlug = await ensureUniqueLivestreamSlug({
      payload,
      baseSlug: normalizedSlug,
    })
  } catch {
    return NextResponse.json({ error: 'slug is invalid' }, { status: 400 })
  }

  try {
    const created = await payload.create({
      collection: 'livestreams',
      data: {
        title,
        slug: uniqueSlug,
        description: description || undefined,
        coverImage: coverImage && Number.isFinite(coverImage) ? coverImage : undefined,
        scheduledAt: scheduledAt ?? undefined,
        status: scheduledAt ? 'scheduled' : 'draft',
        callId: uniqueSlug,
        callType: 'livestream',
        generateSlug: false,
      },
      depth: 0,
      draft: false,
      user,
      overrideAccess: false,
    })

    return NextResponse.json({
      id: created.id,
      slug: created.slug,
      status: created.status,
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      const slugFieldError = error.data.errors.find((entry) => entry.path === 'slug')
      return NextResponse.json(
        {
          error: slugFieldError?.message || error.message || 'Slug không hợp lệ',
        },
        { status: error.status ?? 400 },
      )
    }

    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message || 'Không thể tạo livestream' },
        { status: error.status ?? 500 },
      )
    }

    console.error('[livestreams/create]', error)
    return NextResponse.json({ error: 'Không thể tạo livestream' }, { status: 500 })
  }
}

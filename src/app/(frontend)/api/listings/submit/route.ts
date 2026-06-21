import config from '@payload-config'
import { APIError, createLocalReq, getPayload } from 'payload'
import type { DataFromCollectionSlug } from 'payload'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { getSiteMemberUser } from '@/access/siteMemberUser'

type ListingType = 'job-seeking' | 'job-offer' | 'service' | 'other'

const listingTypes = new Set<ListingType>(['job-seeking', 'job-offer', 'service', 'other'])
const MAX_GALLERY_FILES = 8

type ListingSubmission = {
  address?: unknown
  avatarId?: unknown
  categoryId?: unknown
  city?: unknown
  contactName?: unknown
  contactPhone?: unknown
  description?: unknown
  district?: unknown
  galleryIds?: unknown
  listingType?: unknown
  priceLabel?: unknown
  summary?: unknown
  supportPhone?: unknown
  thumbnailId?: unknown
  title?: unknown
  zaloUrl?: unknown
}

function text(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLength)
}

function optionalUrl(value: unknown): string {
  const raw = text(value, 300)
  if (!raw) return ''

  try {
    const url = new URL(raw)
    if (url.protocol === 'https:' || url.protocol === 'http:') return raw
  } catch {
    return ''
  }

  return ''
}

function parseCategoryId(value: unknown): number | null {
  if (value == null || value === '') return null
  const id = typeof value === 'number' ? value : Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function parseMediaId(value: unknown): number | null {
  if (value == null || value === '') return null
  const id = typeof value === 'number' ? value : Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function parseGalleryIds(value: unknown): number[] {
  if (!Array.isArray(value)) return []

  const ids = value
    .map((item) => parseMediaId(item))
    .filter((item): item is number => item !== null)

  return Array.from(new Set(ids)).slice(0, MAX_GALLERY_FILES)
}

function hasLexicalContent(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false

  const root = (value as { root?: unknown }).root
  if (!root || typeof root !== 'object') return false

  const children = (root as { children?: unknown }).children
  if (!Array.isArray(children)) return false

  const walk = (node: unknown): boolean => {
    if (!node || typeof node !== 'object') return false

    const textNode = (node as { text?: unknown }).text
    if (typeof textNode === 'string' && textNode.trim()) return true

    const childNodes = (node as { children?: unknown }).children
    if (Array.isArray(childNodes)) return childNodes.some(walk)

    return false
  }

  return children.some(walk)
}

async function ensureMediaExists(payload: Awaited<ReturnType<typeof getPayload>>, ids: number[]) {
  if (!ids.length) return

  const result = await payload.find({
    collection: 'media',
    depth: 0,
    limit: ids.length,
    overrideAccess: true,
    pagination: false,
    where: {
      id: {
        in: ids,
      },
    },
  })

  if (result.docs.length !== ids.length) {
    throw new APIError('Ảnh tải lên không hợp lệ', 400)
  }
}

export async function POST(req: NextRequest) {
  let json: ListingSubmission
  try {
    json = (await req.json()) as ListingSubmission
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const title = text(json.title, 140)
  const listingType = listingTypes.has(json.listingType as ListingType)
    ? (json.listingType as ListingType)
    : 'job-seeking'
  const priceLabel = text(json.priceLabel, 80) || 'Thỏa thuận'
  const summary = text(json.summary, 260)
  const city = text(json.city, 80)
  const district = text(json.district, 80)
  const address = text(json.address, 180)
  const contactName = text(json.contactName, 100)
  const contactPhone = text(json.contactPhone, 32)
  const supportPhone = text(json.supportPhone, 32)
  const zaloUrl = optionalUrl(json.zaloUrl)
  const categoryId = parseCategoryId(json.categoryId)
  const avatarId = parseMediaId(json.avatarId)
  const thumbnailId = parseMediaId(json.thumbnailId)
  const galleryIds = parseGalleryIds(json.galleryIds)
  const description = json.description

  if (!title) return NextResponse.json({ error: 'Tiêu đề là bắt buộc' }, { status: 400 })
  if (!hasLexicalContent(description)) {
    return NextResponse.json({ error: 'Nội dung mô tả là bắt buộc' }, { status: 400 })
  }
  if (!city) return NextResponse.json({ error: 'Tỉnh / thành là bắt buộc' }, { status: 400 })
  if (!contactName) {
    return NextResponse.json({ error: 'Tên liên hệ là bắt buộc' }, { status: 400 })
  }
  if (!contactPhone) {
    return NextResponse.json({ error: 'Số điện thoại là bắt buộc' }, { status: 400 })
  }

  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })
  const member = getSiteMemberUser(user)

  if (!member) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập để đăng tin' }, { status: 401 })
  }

  if (categoryId) {
    const category = await payload.findByID({
      collection: 'listing-categories',
      id: categoryId,
      depth: 0,
      overrideAccess: false,
      user: member,
    })
    if (!category) {
      return NextResponse.json({ error: 'Danh mục không hợp lệ' }, { status: 400 })
    }
  }

  try {
    await ensureMediaExists(
      payload,
      [avatarId, thumbnailId, ...galleryIds].filter((item): item is number => item !== null),
    )
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: 'Ảnh tải lên không hợp lệ' }, { status: 400 })
  }

  const payloadReq = await createLocalReq({ user: member }, payload)

  try {
    const doc = await payload.create({
      collection: 'listings',
      data: {
        title,
        listingType,
        priceLabel,
        summary,
        description: description as DataFromCollectionSlug<'listings'>['description'],
        city,
        district,
        address,
        contactName,
        contactPhone,
        supportPhone,
        zaloUrl,
        packageName: 'Miễn phí',
        statusLabel: 'available',
        ...(categoryId ? { categories: [categoryId] } : {}),
        ...(avatarId ? { avatar: avatarId } : {}),
        ...(thumbnailId ? { thumbnail: thumbnailId } : {}),
        ...(galleryIds.length ? { gallery: galleryIds } : {}),
      } as DataFromCollectionSlug<'listings'>,
      depth: 0,
      draft: true,
      overrideAccess: false,
      req: payloadReq,
    })

    return NextResponse.json({
      id: doc.id,
      status: 'pending',
    })
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    payload.logger.error({ err: error, msg: 'Listing submit failed' })
    return NextResponse.json({ error: 'Không tạo được tin đăng' }, { status: 500 })
  }
}

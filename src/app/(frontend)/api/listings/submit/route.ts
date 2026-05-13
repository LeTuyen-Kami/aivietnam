import config from '@payload-config'
import { APIError, createLocalReq, getPayload } from 'payload'
import type { DataFromCollectionSlug } from 'payload'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { getSiteMemberUser } from '@/access/siteMemberUser'

type ListingType = 'job-seeking' | 'job-offer' | 'service' | 'other'

const listingTypes = new Set<ListingType>(['job-seeking', 'job-offer', 'service', 'other'])

type ListingSubmission = {
  address?: unknown
  categoryId?: unknown
  city?: unknown
  contactName?: unknown
  contactPhone?: unknown
  description?: unknown
  district?: unknown
  listingType?: unknown
  priceLabel?: unknown
  summary?: unknown
  supportPhone?: unknown
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

function lexicalFromText(
  value: string,
): NonNullable<DataFromCollectionSlug<'listings'>['description']> {
  return {
    root: {
      type: 'root',
      direction: null,
      format: '',
      indent: 0,
      version: 1,
      children: value
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map((paragraph) => ({
          type: 'paragraph',
          direction: null,
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: paragraph,
              version: 1,
            },
          ],
        })),
    },
  }
}

function parseCategoryId(value: unknown): number | null {
  if (value == null || value === '') return null
  const id = typeof value === 'number' ? value : Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
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
  const descriptionText = text(json.description, 5000)
  const city = text(json.city, 80)
  const district = text(json.district, 80)
  const address = text(json.address, 180)
  const contactName = text(json.contactName, 100)
  const contactPhone = text(json.contactPhone, 32)
  const supportPhone = text(json.supportPhone, 32)
  const zaloUrl = optionalUrl(json.zaloUrl)
  const categoryId = parseCategoryId(json.categoryId)

  if (!title) return NextResponse.json({ error: 'Tiêu đề là bắt buộc' }, { status: 400 })
  if (!descriptionText) {
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

  const payloadReq = await createLocalReq({ user: member }, payload)

  try {
    const doc = await payload.create({
      collection: 'listings',
      data: {
        title,
        listingType,
        priceLabel,
        summary,
        description: lexicalFromText(descriptionText),
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

    const message = error instanceof Error ? error.message : 'Không tạo được tin đăng'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

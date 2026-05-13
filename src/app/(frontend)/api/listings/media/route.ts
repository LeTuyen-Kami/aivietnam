import config from '@payload-config'
import { APIError, createLocalReq, getPayload } from 'payload'
import type { File as PayloadFile } from 'payload'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { getSiteMemberUser } from '@/access/siteMemberUser'

const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024

function sanitizeAlt(value: FormDataEntryValue | null): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, 180)
}

export async function POST(req: Request) {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })
  const member = getSiteMemberUser(user)

  if (!member) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập để tải ảnh' }, { status: 401 })
  }

  const formData = await req.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ error: 'Form data không hợp lệ' }, { status: 400 })
  }

  const file = formData.get('file')
  const alt = sanitizeAlt(formData.get('alt'))

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Thiếu file tải lên' }, { status: 400 })
  }

  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Chỉ hỗ trợ JPG, PNG, WEBP hoặc GIF' }, { status: 400 })
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json({ error: 'Mỗi ảnh tối đa 10MB' }, { status: 400 })
  }

  const payloadReq = await createLocalReq({ user: member }, payload)

  try {
    const buffer = Buffer.from(await file.arrayBuffer())

    const doc = await payload.create({
      collection: 'media',
      data: {
        alt,
      },
      depth: 0,
      file: {
        data: buffer,
        mimetype: file.type,
        name: file.name,
        size: file.size,
      } satisfies PayloadFile,
      overrideAccess: false,
      req: payloadReq,
    })

    return NextResponse.json({
      doc: {
        alt: doc.alt,
        id: doc.id,
        mimeType: doc.mimeType,
        url: doc.url,
      },
    })
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    const message = error instanceof Error ? error.message : 'Không tải được ảnh lên'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import config from '@payload-config'
import { getPayload } from 'payload'
import { sql } from '@payloadcms/db-postgres'
import { NextResponse } from 'next/server'

import { cookies } from 'next/headers'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const numericId = Number(id)
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return NextResponse.json({ error: 'Post ID is invalid' }, { status: 400 })
  }

  try {
    // Cookie chống buff view (best-effort).
    const cookieStore = await cookies()
    if (cookieStore.get(`viewed_${numericId}`)) {
      return NextResponse.json({ success: true, message: 'Already viewed' })
    }

    const payload = await getPayload({ config })

    // Atomic increment ở DB (tránh race read-modify-write) và bỏ qua Payload hooks
    // nên KHÔNG kích hoạt revalidate trang mỗi lượt xem (audit M6).
    const result = await payload.db.drizzle.execute(
      sql`UPDATE "posts" SET "views" = COALESCE("views", 0) + 1 WHERE "id" = ${numericId} RETURNING "views"`,
    )

    const rows = (result as { rows?: Array<{ views?: number | string }> }).rows ?? []
    const rawViews = rows[0]?.views
    if (rawViews == null) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const newViews = Number(rawViews)
    const response = NextResponse.json({ views: newViews })
    response.cookies.set(`viewed_${numericId}`, 'true', {
      maxAge: 60 * 60 * 24, // 1 ngày
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })

    return response
  } catch (error) {
    console.error('Error incrementing views:', error)
    return NextResponse.json({ error: 'Failed to increment views' }, { status: 500 })
  }
}

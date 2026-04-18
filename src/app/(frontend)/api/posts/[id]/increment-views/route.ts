import type { PayloadRequest } from 'payload'

import config from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

import { cookies } from 'next/headers'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
  }

  try {
    // Check cookie to prevent view buffing
    const cookieStore = await cookies()
    const viewedCookie = cookieStore.get(`viewed_${id}`)

    if (viewedCookie) {
      // User has already viewed this post recently
      return NextResponse.json({ success: true, message: 'Already viewed' })
    }

    const payload = await getPayload({ config })

    // Get current post to read views
    const post = await payload.findByID({
      collection: 'posts',
      id,
      depth: 0,
      overrideAccess: true,
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Increment views
    const currentViews = (post.views as number) || 0
    const newViews = currentViews + 1

    await payload.update({
      collection: 'posts',
      id,
      data: {
        views: newViews,
      },
      overrideAccess: true,
    })

    // Return new views and set cookie for 1 day
    const response = NextResponse.json({ views: newViews })
    response.cookies.set(`viewed_${id}`, 'true', {
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

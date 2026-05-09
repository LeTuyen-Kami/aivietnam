import config from '@payload-config'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { getSiteMemberUser } from '@/access/siteMemberUser'
import { getStreamServerClient } from '@/lib/stream/server'
import { streamDisplayName, streamUserIdFromPayloadUser } from '@/lib/stream/user'

function normalizeGuestId(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().toLowerCase()
  if (!/^guest-[a-z0-9-]+$/.test(trimmed)) return null
  return trimmed
}

function normalizeGuestName(value: unknown): string {
  if (typeof value !== 'string') return 'Khách'
  const trimmed = value.trim()
  return trimmed || 'Khách'
}

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config })
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })

  let guestPayload: { guestId?: unknown; guestName?: unknown } = {}
  try {
    guestPayload = (await req.json()) as { guestId?: unknown; guestName?: unknown }
  } catch {
    guestPayload = {}
  }

  const member = getSiteMemberUser(user)
  const streamUserId = member
    ? streamUserIdFromPayloadUser(member)
    : normalizeGuestId(guestPayload.guestId)
  const displayName = member
    ? streamDisplayName(member)
    : normalizeGuestName(guestPayload.guestName)

  if (!streamUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = getStreamServerClient()
  await client.upsertUsers([
    {
      id: streamUserId,
      name: displayName,
    },
  ])

  const sec = Number(process.env.STREAM_TOKEN_VALIDITY_SECONDS) || 3600
  const token = client.generateUserToken({
    user_id: streamUserId,
    validity_in_seconds: sec,
  })
  const expiresAt = new Date(Date.now() + sec * 1000).toISOString()

  return NextResponse.json({ token, expiresAt, userId: streamUserId, name: displayName })
}

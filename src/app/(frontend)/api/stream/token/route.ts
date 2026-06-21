import config from '@payload-config'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { getSiteMemberUser } from '@/access/siteMemberUser'
import { getStreamServerClient } from '@/lib/stream/server'
import { streamDisplayName, streamUserIdFromPayloadUser } from '@/lib/stream/user'
import { ensureGuestId, setGuestCookie } from '@/utilities/guestId'
import { clientIpFromHeaders, rateLimit } from '@/utilities/rateLimit'

function normalizeGuestName(value: unknown): string {
  if (typeof value !== 'string') return 'Khách'
  const trimmed = value.trim()
  return trimmed || 'Khách'
}

export async function POST(req: NextRequest) {
  if (!rateLimit(`stream-token:${clientIpFromHeaders(req)}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const payload = await getPayload({ config })
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })

  let guestPayload: { guestName?: unknown } = {}
  try {
    guestPayload = (await req.json()) as { guestName?: unknown }
  } catch {
    guestPayload = {}
  }

  // Identity guest lấy từ cookie httpOnly do server cấp, KHÔNG nhận từ body —
  // chống mạo danh / ghi đè record Stream tuỳ ý (audit M-c). Tên hiển thị chỉ là
  // cosmetic nên vẫn cho phép đặt.
  const member = getSiteMemberUser(user)
  const guest = member ? null : ensureGuestId(req)
  const streamUserId = member ? streamUserIdFromPayloadUser(member) : `guest-${guest!.guestId}`
  const displayName = member
    ? streamDisplayName(member)
    : normalizeGuestName(guestPayload.guestName)

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

  const res = NextResponse.json({ token, expiresAt, userId: streamUserId, name: displayName })
  if (guest?.isNew) setGuestCookie(res, guest.guestId)
  return res
}

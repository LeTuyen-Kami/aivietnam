import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

import { getSiteMemberUser } from '@/access/siteMemberUser'
import { getStreamServerClient } from '@/lib/stream/server'
import { streamDisplayName, streamUserIdFromPayloadUser } from '@/lib/stream/user'

export async function POST(_req: NextRequest) {
  const payload = await getPayload({ config })
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const member = getSiteMemberUser(user)
  if (!member) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = getStreamServerClient()
  const streamUserId = streamUserIdFromPayloadUser(member)
  const displayName = streamDisplayName(member)

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

  return NextResponse.json({ token, expiresAt })
}

import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

import { canBroadcastLivestream } from '@/access/isAdminUser'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const livestreamId = Number(id)
  if (!livestreamId || Number.isNaN(livestreamId)) {
    return NextResponse.json({ error: 'Invalid livestream id' }, { status: 400 })
  }

  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canBroadcastLivestream(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const endedDoc = await payload.update({
    collection: 'livestreams',
    id: livestreamId,
    data: { status: 'ended' },
    user,
    overrideAccess: false,
    depth: 0,
  })

  return NextResponse.json({
    id: endedDoc.id,
    status: 'ended',
  })
}

import config from '@payload-config'
import { getPayload } from 'payload'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { getSiteMemberUser } from '@/access/siteMemberUser'
import { ensureGuestId, setGuestCookie } from '@/utilities/guestId'

const REPORT_FORM_TITLE = 'Báo cáo bình luận'

export async function POST(req: NextRequest) {
  let json: { commentId?: unknown; reason?: unknown; details?: unknown }
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const commentId = typeof json.commentId === 'number' ? json.commentId : Number(json.commentId)
  const reason = typeof json.reason === 'string' ? json.reason.trim() : ''
  const details = typeof json.details === 'string' ? json.details.trim() : ''

  if (!commentId || Number.isNaN(commentId)) {
    return NextResponse.json({ error: 'commentId is required' }, { status: 400 })
  }
  if (!reason) {
    return NextResponse.json({ error: 'reason is required' }, { status: 400 })
  }

  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })
  const member = getSiteMemberUser(user)
  const guest = member ? null : ensureGuestId(req)

  const targetComment = member
    ? await payload.findByID({
        collection: 'comments',
        id: commentId,
        depth: 0,
        user: member,
        overrideAccess: false,
      })
    : await payload.findByID({
        collection: 'comments',
        id: commentId,
        depth: 0,
        overrideAccess: true,
      })
  // Guests can only report publicly visible (approved) comments.
  if (!targetComment || (!member && targetComment.status !== 'approved')) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  }

  const formResult = await payload.find({
    collection: 'forms',
    where: { title: { equals: REPORT_FORM_TITLE } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })

  const reportForm = formResult.docs[0]
  if (!reportForm) {
    return NextResponse.json({ error: 'Report form is not configured' }, { status: 500 })
  }

  await payload.create({
    collection: 'form-submissions',
    data: {
      form: reportForm.id,
      submissionData: [
        { field: 'reporter-email', value: member?.email ?? '' },
        { field: 'comment-id', value: String(commentId) },
        { field: 'reason', value: reason },
        { field: 'details', value: details || '' },
        { field: 'reporter-user-id', value: member ? String(member.id) : `guest:${guest!.guestId}` },
      ],
    },
    depth: 0,
    overrideAccess: true,
  })

  const res = NextResponse.json({ success: true })
  if (guest?.isNew) setGuestCookie(res, guest.guestId)
  return res
}

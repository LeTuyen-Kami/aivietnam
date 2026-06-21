import { OAuth2Client } from 'google-auth-library'
import { NextRequest, NextResponse } from 'next/server'

import { OAUTH_STATE_COOKIE, safeReturnTo } from '@/utilities/safeReturnTo'

function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing Google OAuth env vars')
  }
  return new OAuth2Client(clientId, clientSecret, redirectUri)
}

export async function GET(req: NextRequest) {
  try {
    getOAuthClient()
  } catch {
    return NextResponse.json({ error: 'Google sign-in is not configured' }, { status: 503 })
  }

  const returnTo = safeReturnTo(req.nextUrl.searchParams.get('returnTo'))

  // Nonce chống CSRF/session-fixation: nhúng vào state VÀ lưu cookie httpOnly,
  // callback so khớp hai bên (audit M-b).
  const nonce = crypto.randomUUID()
  const client = getOAuthClient()
  const state = Buffer.from(JSON.stringify({ returnTo, n: nonce }), 'utf8').toString('base64url')

  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    state,
    prompt: 'select_account',
  })

  const res = NextResponse.redirect(url)
  res.cookies.set(OAUTH_STATE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 600, // 10 phút đủ cho luồng đăng nhập
  })
  return res
}

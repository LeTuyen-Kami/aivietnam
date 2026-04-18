import { OAuth2Client } from 'google-auth-library'
import { NextRequest, NextResponse } from 'next/server'

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

  let returnTo = req.nextUrl.searchParams.get('returnTo') ?? '/'
  if (!returnTo.startsWith('/') || returnTo.startsWith('//')) {
    returnTo = '/'
  }

  const client = getOAuthClient()
  const state = Buffer.from(JSON.stringify({ returnTo, n: crypto.randomUUID() }), 'utf8').toString(
    'base64url',
  )

  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    state,
    prompt: 'select_account',
  })

  return NextResponse.redirect(url)
}

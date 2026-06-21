import { randomBytes } from 'crypto'

import config from '@payload-config'
import { generatePayloadCookie, getPayload } from 'payload'
import { OAuth2Client } from 'google-auth-library'
import { NextRequest, NextResponse } from 'next/server'

import { getServerSideURL } from '@/utilities/getURL'
import { OAUTH_STATE_COOKIE, safeReturnTo } from '@/utilities/safeReturnTo'

function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI!
  return new OAuth2Client(clientId, clientSecret, redirectUri)
}

export async function GET(req: NextRequest) {
  const base = getServerSideURL()

  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !process.env.GOOGLE_OAUTH_REDIRECT_URI
  ) {
    return NextResponse.redirect(new URL('/?auth=oauth_unconfigured', base))
  }

  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const stateParam = url.searchParams.get('state')
  const err = url.searchParams.get('error')

  if (err) {
    return NextResponse.redirect(
      new URL(`/?auth=oauth_error&message=${encodeURIComponent(err)}`, base),
    )
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(new URL('/?auth=oauth_error&message=missing_code', base))
  }

  let returnTo = '/'
  let stateNonce: string | undefined
  try {
    const parsed = JSON.parse(Buffer.from(stateParam, 'base64url').toString('utf8')) as {
      returnTo?: string
      n?: string
    }
    returnTo = safeReturnTo(parsed.returnTo)
    stateNonce = typeof parsed.n === 'string' ? parsed.n : undefined
  } catch {
    return NextResponse.redirect(new URL('/?auth=oauth_error&message=invalid_state', base))
  }

  // CSRF/session-fixation: nonce trong state phải khớp cookie httpOnly đã set lúc
  // bắt đầu luồng (audit M-b).
  const cookieNonce = req.cookies.get(OAUTH_STATE_COOKIE)?.value
  if (!stateNonce || !cookieNonce || stateNonce !== cookieNonce) {
    return NextResponse.redirect(new URL('/?auth=oauth_error&message=invalid_state', base))
  }

  const client = getOAuthClient()
  let sub: string
  let email: string
  let name: string | undefined
  try {
    const { tokens } = await client.getToken(code)
    if (!tokens.id_token) {
      throw new Error('No id_token')
    }
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()
    if (!payload?.sub || !payload.email) {
      throw new Error('Missing profile')
    }
    if (payload.email_verified === false) {
      throw new Error('Email not verified')
    }
    sub = payload.sub
    email = payload.email.toLowerCase().trim()
    name = payload.name ?? undefined
  } catch {
    return NextResponse.redirect(new URL('/?auth=oauth_error&message=token_failed', base))
  }

  const payload = await getPayload({ config })
  const usersSlug = 'users'
  const collectionConfig = payload.collections[usersSlug]?.config
  if (!collectionConfig?.auth) {
    return NextResponse.redirect(new URL('/?auth=oauth_error&message=config', base))
  }

  const bySub = await payload.find({
    collection: usersSlug,
    where: { googleSub: { equals: sub } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const byEmail = await payload.find({
    collection: usersSlug,
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const tempPass = randomBytes(32).toString('base64url')

  let userId: number

  if (bySub.docs[0]) {
    // User OAuth-native (đã có googleSub trùng). Reset password tạm chỉ để gọi
    // payload.login bên dưới — user này không dùng password đăng nhập nên vô hại.
    userId = bySub.docs[0].id as number
    await payload.update({
      collection: usersSlug,
      id: userId,
      data: {
        password: tempPass,
        ...(name ? { name } : {}),
      },
      overrideAccess: true,
    })
  } else if (byEmail.docs[0]) {
    // Email đã tồn tại nhưng KHÔNG khớp googleSub (bySub rỗng). KHÔNG tự link và
    // KHÔNG ghi đè password — chống account-takeover + password-clobber (audit M-a).
    // Người dùng nên đăng nhập bằng mật khẩu, hoặc admin liên kết thủ công.
    return NextResponse.redirect(new URL('/?auth=oauth_error&message=email_exists', base))
  } else {
    const created = await payload.create({
      collection: usersSlug,
      data: {
        email,
        password: tempPass,
        name: name ?? email,
        roles: ['member'],
        googleSub: sub,
      },
      draft: false,
      overrideAccess: true,
    })
    userId = created.id as number
  }

  let loginResult
  try {
    loginResult = await payload.login({
      collection: usersSlug,
      data: { email, password: tempPass },
      overrideAccess: true,
    })
  } catch {
    return NextResponse.redirect(new URL('/?auth=oauth_error&message=login_failed', base))
  }

  const redirectUrl = new URL(returnTo, base)
  const res = NextResponse.redirect(redirectUrl)
  const cookieStr = generatePayloadCookie({
    collectionAuthConfig: collectionConfig.auth,
    cookiePrefix: payload.config.cookiePrefix,
    token: loginResult.token!,
  })
  res.headers.append('Set-Cookie', cookieStr)
  res.cookies.delete(OAUTH_STATE_COOKIE)
  return res
}

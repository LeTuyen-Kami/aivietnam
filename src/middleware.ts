import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

function getPayloadToken(req: NextRequest): string | null {
  return req.cookies.get('payload-token')?.value ?? req.cookies.get('__Secure-payload-token')?.value ?? null
}

/**
 * Payload ký JWT bằng HS256 với key = sha256(PAYLOAD_SECRET) -> hex -> 32 ký tự đầu
 * (xem payload `index.js` deriveSecret + `auth/jwt.js`). Phải derive đúng key này
 * thì jwtVerify mới khớp. Dùng Web Crypto vì middleware chạy trên Edge runtime.
 */
async function getSigningKey(): Promise<Uint8Array | null> {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) return null
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return new TextEncoder().encode(hex.slice(0, 32))
}

async function getVerifiedRoles(token: string): Promise<string[]> {
  const key = await getSigningKey()
  if (!key) return []

  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] })
    const roles = (payload as { roles?: unknown }).roles
    if (!Array.isArray(roles)) return []
    return roles.filter((role): role is string => typeof role === 'string')
  } catch {
    // Token sai chữ ký / hết hạn / hỏng -> không có quyền.
    return []
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  if (!pathname.startsWith('/broadcaster')) return NextResponse.next()

  const token = getPayloadToken(req)
  if (!token) {
    const loginUrl = new URL('/', req.url)
    loginUrl.searchParams.set('auth', 'login_required')
    loginUrl.searchParams.set('returnTo', `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  const roles = await getVerifiedRoles(token)
  if (!roles.includes('admin') && !roles.includes('moderator')) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/broadcaster/:path*'],
}

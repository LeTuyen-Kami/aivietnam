import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

function getPayloadToken(req: NextRequest): string | null {
  return req.cookies.get('payload-token')?.value ?? req.cookies.get('__Secure-payload-token')?.value ?? null
}

function getJwtRoles(token: string): string[] {
  const payloadPart = token.split('.')[1]
  if (!payloadPart) return []

  try {
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const decoded = JSON.parse(atob(padded)) as {
      roles?: unknown
    }

    if (!Array.isArray(decoded.roles)) return []
    return decoded.roles.filter((role): role is string => typeof role === 'string')
  } catch {
    return []
  }
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  if (!pathname.startsWith('/broadcaster')) return NextResponse.next()

  const token = getPayloadToken(req)
  if (!token) {
    const loginUrl = new URL('/', req.url)
    loginUrl.searchParams.set('auth', 'login_required')
    loginUrl.searchParams.set('returnTo', `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  const roles = getJwtRoles(token)
  if (!roles.includes('admin') && !roles.includes('moderator')) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/broadcaster/:path*'],
}

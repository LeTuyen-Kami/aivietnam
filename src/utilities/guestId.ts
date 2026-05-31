import type { NextRequest, NextResponse } from 'next/server'

/**
 * Anonymous visitor identity for guest comments / reactions.
 *
 * The server issues a long-lived httpOnly cookie the first time a guest
 * interacts, then reads it back on subsequent requests so we can attribute
 * comments and toggle reactions for the "same" anonymous person.
 *
 * Caveat: this is per-browser and clearable by the user, so it is good enough
 * for like counts but is not an anti-abuse identity.
 */
export const GUEST_COOKIE = 'sc_guest_id'

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

export function getGuestId(req: NextRequest): string | null {
  const value = req.cookies.get(GUEST_COOKIE)?.value
  return value && value.length > 0 ? value : null
}

/** Returns the existing guest id, or a freshly generated one flagged as new. */
export function ensureGuestId(req: NextRequest): { guestId: string; isNew: boolean } {
  const existing = getGuestId(req)
  if (existing) return { guestId: existing, isNew: false }
  return { guestId: crypto.randomUUID(), isNew: true }
}

/** Attach the guest cookie to a response when a new id was just minted. */
export function setGuestCookie<T>(res: NextResponse<T>, guestId: string): NextResponse<T> {
  res.cookies.set(GUEST_COOKIE, guestId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_YEAR_SECONDS,
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}

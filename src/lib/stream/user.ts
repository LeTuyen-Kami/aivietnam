import type { User } from '@/payload-types'

/**
 * STRM-03: Payload `user.id` is the canonical Stream user id.
 */
export function streamUserIdFromPayloadUser(user: User): string {
  return String(user.id)
}

export function streamDisplayName(user: User): string {
  return user.name ?? user.email ?? String(user.id)
}

import type { User } from '@/payload-types'
import type { PayloadRequest } from 'payload'

/** Logged-in frontend member (`users` collection), excluding MCP API key users. */
export function getSiteMemberUser(user: PayloadRequest['user']): User | null {
  if (!user || typeof user !== 'object') return null
  if (!('collection' in user)) return null
  if ((user as { collection: string }).collection !== 'users') return null
  return user as User
}

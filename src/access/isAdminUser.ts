import type { User } from '@/payload-types'
import type { PayloadRequest } from 'payload'

export function isUsersCollectionAdmin(user: PayloadRequest['user']): user is User {
  if (!user || typeof user !== 'object') return false
  if (!('collection' in user)) return false
  if ((user as { collection: string }).collection !== 'users') return false
  const u = user as User
  return Boolean(u.roles?.includes('admin'))
}

export function canAccessAdminPanel(user: PayloadRequest['user']): user is User {
  if (!user || typeof user !== 'object') return false
  if (!('collection' in user)) return false
  if ((user as { collection: string }).collection !== 'users') return false
  const u = user as User
  return Boolean(
    u.roles?.includes('admin') || u.roles?.includes('editor') || u.roles?.includes('moderator'),
  )
}

import { isUsersCollectionAdmin } from '@/access/isAdminUser'
import { User } from '@/payload-types'
import type { CollectionBeforeChangeHook } from 'payload'

export const protectRoles: CollectionBeforeChangeHook<{ id: string } & User> = ({
  req,
  data,
}) => {
  const isAdmin = isUsersCollectionAdmin(req.user)
  if (!isAdmin) {
    return {
      ...data,
      roles: ['member'],
    }
  }
  const userRoles = new Set(data?.roles ?? [])
  userRoles.add('editor')
  userRoles.add('moderator')
  return {
    ...data,
    roles: Array.from(userRoles),
  }
}

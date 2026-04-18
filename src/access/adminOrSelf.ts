import type { Access } from 'payload'

import { isUsersCollectionAdmin } from './isAdminUser'

export const adminOrSelf: Access = ({ req: { user }, id }) => {
  if (isUsersCollectionAdmin(user)) return true
  if (!user || id === undefined) return false
  if (!('id' in user)) return false
  return String(user.id) === String(id)
}

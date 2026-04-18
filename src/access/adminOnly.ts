import type { Access } from 'payload'

import { isUsersCollectionAdmin } from './isAdminUser'

export const adminOnly: Access = ({ req: { user } }) => isUsersCollectionAdmin(user)

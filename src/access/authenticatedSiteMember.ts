import type { Access } from 'payload'

import { getSiteMemberUser } from './siteMemberUser'

export const authenticatedSiteMember: Access = ({ req: { user } }) => Boolean(getSiteMemberUser(user))

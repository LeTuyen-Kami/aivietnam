import { Access } from 'payload'
import { checkRole } from './checkRole'

const moderator: Access = ({ req: { user } }) => {
  if (user) {
    if ('roles' in user && checkRole(['admin', 'moderator'], user)) {
      return true
    }

    return { id: { equals: user.id } }
  }
  return false
}

export default moderator

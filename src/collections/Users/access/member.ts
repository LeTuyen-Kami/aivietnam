import { Access } from 'payload'
import { checkRole } from './checkRole'

const member: Access = ({ req: { user } }) => {
  if (user) {
    if ('roles' in user && checkRole(['admin', 'editor', 'moderator', 'member'], user)) {
      return true
    }

    return { id: { equals: user.id } }
  }
  return false
}

export default member

import { Access } from 'payload'
import { checkRole } from './checkRole'

const editor: Access = ({ req: { user } }) => {
  if (user) {
    if ('roles' in user && checkRole(['admin', 'editor', 'moderator'], user)) {
      return true
    }

    return { id: { equals: user.id } }
  }
  return false
}

export default editor

import { Access } from 'payload'
import { checkRole } from './checkRole'

const admin: Access = ({ req: { user } }) => {
  if (user) {
    if ('roles' in user && checkRole(['admin'], user)) {
      return true
    }

    return { id: { equals: user.id } }
  }
  return false
}

export default admin

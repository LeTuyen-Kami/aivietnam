import { User } from '@/payload-types'

type RoleCapableUser = {
  roles?: User['roles']
}

export const checkRole = (
  allRoles: NonNullable<User['roles']> = [],
  user?: RoleCapableUser | null,
): boolean => {
  if (!user?.roles?.length) return false

  return allRoles.some((role) => user.roles?.some((userRole) => userRole === role))
}

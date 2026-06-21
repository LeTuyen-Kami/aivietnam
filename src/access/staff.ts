import type { AccessArgs } from 'payload'

import type { User } from '@/payload-types'

import { canAccessAdminPanel } from '@/access/isAdminUser'

/**
 * Staff = admin | editor | moderator (tức bất kỳ vai trò nào KHÔNG phải member-only).
 * Dùng cho các thao tác ghi (create/update/delete) nội dung mà member không được phép.
 */
export const staff = ({ req: { user } }: AccessArgs<User>): boolean => canAccessAdminPanel(user)

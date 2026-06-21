import { isUsersCollectionAdmin } from '@/access/isAdminUser'
import { User } from '@/payload-types'
import type { CollectionBeforeChangeHook } from 'payload'

export const protectRoles: CollectionBeforeChangeHook<{ id: string } & User> = ({ req, data }) => {
  const isAdmin = isUsersCollectionAdmin(req.user)
  if (!isAdmin) {
    // Non-admin không được tự đặt/leo thang vai trò: ép về member.
    return {
      ...data,
      roles: ['member'],
    }
  }
  // Admin: giữ nguyên roles do admin chọn (không tự ý thêm editor/moderator).
  return data
}

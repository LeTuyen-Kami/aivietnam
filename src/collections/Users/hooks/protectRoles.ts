import { isUsersCollectionAdmin } from '@/access/isAdminUser'
import { User } from '@/payload-types'
import type { CollectionBeforeChangeHook } from 'payload'

export const protectRoles: CollectionBeforeChangeHook<{ id: string } & User> = ({
  req,
  data,
  operation,
}) => {
  // Admin: giữ nguyên roles do admin chọn.
  if (isUsersCollectionAdmin(req.user)) {
    return data
  }

  // Non-admin (kể cả luồng không đăng nhập như reset password / OAuth):
  // không được đặt/leo thang roles.
  if (operation === 'create') {
    // Tài khoản mới do non-admin tạo luôn là member.
    return { ...data, roles: ['member'] }
  }

  // Update: BỎ roles khỏi payload thay vì ép về member, để các thao tác
  // không liên quan (đổi mật khẩu, reset password...) không xoá role hiện có.
  const next = { ...data } as Record<string, unknown>
  delete next.roles
  return next as typeof data
}

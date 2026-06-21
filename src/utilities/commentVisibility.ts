import type { PayloadRequest } from 'payload'
import type { getPayload } from 'payload'

import type { Comment } from '@/payload-types'
import { isUsersCollectionAdmin } from '@/access/isAdminUser'
import { getSiteMemberUser } from '@/access/siteMemberUser'

/**
 * Trả về comment nếu actor được phép TƯƠNG TÁC (like/react/report), ngược lại null.
 * Guest và member chỉ tác động được comment `approved` (hoặc của chính member).
 * Dùng chung cho like/reaction/report để tránh lệch logic (audit: reaction thiếu gate).
 */
export async function getCommentIfVisibleForUser(
  commentId: number,
  user: PayloadRequest['user'],
  payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<Comment | null> {
  const comment = (await payload.findByID({
    collection: 'comments',
    id: commentId,
    depth: 0,
    overrideAccess: true,
  })) as Comment | null

  if (!comment) return null
  if (isUsersCollectionAdmin(user)) return comment

  const member = getSiteMemberUser(user)
  const authorId =
    typeof comment.author === 'object' && comment.author ? comment.author.id : comment.author

  if (member) {
    if (comment.status === 'approved' || authorId === member.id) return comment
    return null
  }

  if (comment.status === 'approved') return comment
  return null
}

import type { CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

import { isUsersCollectionAdmin } from '@/access/isAdminUser'

/**
 * Chặn tạo/sửa bình luận khi bài viết đã tắt bình luận (`post.commentsDisabled`).
 * Áp dụng ở TẦNG COLLECTION để bịt cả REST API mặc định (/api/comments),
 * không chỉ route custom /api/site-comments. (audit H2)
 * Admin được bỏ qua để vẫn moderate (duyệt/sửa/từ chối) được.
 */
export const enforceCommentsEnabled: CollectionBeforeValidateHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if ((operation !== 'create' && operation !== 'update') || !data) return data
  if (isUsersCollectionAdmin(req.user)) return data

  const postRef = data.post ?? originalDoc?.post
  const postId = typeof postRef === 'object' && postRef !== null ? postRef.id : postRef
  if (postId == null) return data

  try {
    const post = await req.payload.findByID({
      collection: 'posts',
      id: postId,
      depth: 0,
      overrideAccess: true,
    })
    // Non-admin không bình luận được trên bài chưa công khai (chống đoán id bài
    // draft để seed comment — audit: site-comments thiếu kiểm published).
    if (post?._status !== 'published') {
      throw new APIError('Không thể bình luận trên bài viết chưa công khai.', 403)
    }
    if (post?.commentsDisabled) {
      throw new APIError('Bình luận đã bị tắt cho bài viết này.', 403)
    }
  } catch (err) {
    // Lỗi tự ném (comments disabled) phải được giữ nguyên.
    if (err instanceof APIError) throw err
    // Không tìm thấy post / lỗi tra cứu khác -> để các validation sau xử lý.
    return data
  }

  return data
}

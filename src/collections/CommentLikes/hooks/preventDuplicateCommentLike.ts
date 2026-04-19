import type { CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

export const preventDuplicateCommentLike: CollectionBeforeValidateHook = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create' || !data?.comment || !req.user) return data

  const userId = req.user.id

  const existing = await req.payload.find({
    collection: 'comment-likes',
    where: {
      and: [{ comment: { equals: data.comment } }, { user: { equals: userId } }],
    },
    limit: 1,
    depth: 0,
    req,
  })

  if (existing.docs.length > 0) {
    throw new APIError('Bạn đã thích bình luận này rồi', 400)
  }

  return data
}

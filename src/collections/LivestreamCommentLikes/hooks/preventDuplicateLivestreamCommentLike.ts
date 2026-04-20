import { APIError } from 'payload'
import type { CollectionBeforeValidateHook } from 'payload'

export const preventDuplicateLivestreamCommentLike: CollectionBeforeValidateHook = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create' || !data?.comment || !req.user) return data

  const userId = req.user.id

  const existing = await req.payload.find({
    collection: 'livestream-comment-likes',
    where: {
      and: [{ comment: { equals: data.comment } }, { user: { equals: userId } }],
    },
    limit: 1,
    depth: 0,
    req,
  })

  if (existing.docs.length > 0) {
    throw new APIError('Bạn đã thả tim bình luận này rồi', 400)
  }

  return data
}

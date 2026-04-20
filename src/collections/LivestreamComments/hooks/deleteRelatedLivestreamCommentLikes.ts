import type { CollectionBeforeDeleteHook } from 'payload'

export const deleteRelatedLivestreamCommentLikes: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const result = await req.payload.find({
    collection: 'livestream-comment-likes',
    where: { comment: { equals: id } },
    limit: 500,
    depth: 0,
    req,
    overrideAccess: true,
  })

  for (const doc of result.docs) {
    await req.payload.delete({
      collection: 'livestream-comment-likes',
      id: doc.id,
      req,
      overrideAccess: true,
    })
  }
}

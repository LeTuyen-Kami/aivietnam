import type { CollectionBeforeDeleteHook } from 'payload'

export const deleteRelatedCommentLikes: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const result = await req.payload.find({
    collection: 'comment-likes',
    where: { comment: { equals: id } },
    limit: 500,
    depth: 0,
    req,
    overrideAccess: true,
  })

  for (const doc of result.docs) {
    await req.payload.delete({
      collection: 'comment-likes',
      id: doc.id,
      req,
      overrideAccess: true,
    })
  }
}

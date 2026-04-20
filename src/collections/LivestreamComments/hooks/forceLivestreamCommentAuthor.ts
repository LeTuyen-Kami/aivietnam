import type { CollectionBeforeChangeHook } from 'payload'

export const forceLivestreamCommentAuthor: CollectionBeforeChangeHook = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create' || !data || !req.user) return data
  data.author = req.user.id
  return data
}

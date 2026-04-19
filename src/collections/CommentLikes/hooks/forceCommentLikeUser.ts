import type { CollectionBeforeChangeHook } from 'payload'

export const forceCommentLikeUser: CollectionBeforeChangeHook = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create' || !data || !req.user) return data
  data.user = req.user.id
  return data
}

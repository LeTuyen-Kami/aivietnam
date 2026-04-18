import type { CollectionBeforeChangeHook } from 'payload'

export const forceCommentAuthor: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || !data || !req.user) return data
  data.author = req.user.id
  return data
}

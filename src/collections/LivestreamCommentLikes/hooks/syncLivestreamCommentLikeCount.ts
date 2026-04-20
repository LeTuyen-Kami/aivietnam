import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

function commentIdFromDoc(comment: unknown): number | undefined {
  if (comment == null) return undefined
  if (typeof comment === 'object' && 'id' in comment && typeof (comment as { id: unknown }).id === 'number') {
    return (comment as { id: number }).id
  }
  if (typeof comment === 'number') return comment
  return undefined
}

export const incrementLivestreamCommentLikeCount: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create') return
  const commentId = commentIdFromDoc(doc.comment)
  if (commentId == null) return

  const current = await req.payload.findByID({
    collection: 'livestream-comments',
    id: commentId,
    depth: 0,
    req,
  })
  if (!current) return

  await req.payload.update({
    collection: 'livestream-comments',
    id: commentId,
    data: { likeCount: (current.likeCount ?? 0) + 1 },
    req,
  })
}

export const decrementLivestreamCommentLikeCount: CollectionAfterDeleteHook = async ({
  doc,
  req,
}) => {
  const commentId = commentIdFromDoc(doc.comment)
  if (commentId == null) return

  const current = await req.payload.findByID({
    collection: 'livestream-comments',
    id: commentId,
    depth: 0,
    req,
  })
  if (!current) return

  await req.payload.update({
    collection: 'livestream-comments',
    id: commentId,
    data: { likeCount: Math.max(0, (current.likeCount ?? 0) - 1) },
    req,
  })
}

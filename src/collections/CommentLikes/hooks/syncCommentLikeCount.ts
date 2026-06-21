import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { sql } from '@payloadcms/db-postgres'

function commentIdFromDoc(comment: unknown): number | undefined {
  if (comment == null) return undefined
  if (
    typeof comment === 'object' &&
    'id' in comment &&
    typeof (comment as { id: unknown }).id === 'number'
  ) {
    return (comment as { id: number }).id
  }
  if (typeof comment === 'number') return comment
  return undefined
}

// Atomic increment/decrement ở DB để tránh race read-modify-write (audit: likeCount race).
export const incrementCommentLikeCount: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create') return
  const commentId = commentIdFromDoc(doc.comment)
  if (commentId == null) return

  await req.payload.db.drizzle.execute(
    sql`UPDATE "comments" SET "like_count" = COALESCE("like_count", 0) + 1 WHERE "id" = ${commentId}`,
  )
}

export const decrementCommentLikeCount: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const commentId = commentIdFromDoc(doc.comment)
  if (commentId == null) return

  await req.payload.db.drizzle.execute(
    sql`UPDATE "comments" SET "like_count" = GREATEST(0, COALESCE("like_count", 0) - 1) WHERE "id" = ${commentId}`,
  )
}

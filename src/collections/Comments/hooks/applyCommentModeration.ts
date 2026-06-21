import { APIError } from 'payload'
import type { CollectionBeforeChangeHook } from 'payload'

import { isUsersCollectionAdmin } from '@/access/isAdminUser'
import type { User } from '@/payload-types'

type ModerationRuleDoc = {
  ruleType?: 'blockedKeyword' | 'blockedUser' | null
  keyword?: string | null
  blockedUser?: number | User | null
}

function normalizeText(s: string): string {
  return s.trim().toLowerCase()
}

export const applyCommentModeration: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation !== 'create' && operation !== 'update') return data
  if (!data) return data

  const authorId =
    operation === 'create'
      ? (data.author as number | User | undefined)
      : (data.author ?? originalDoc?.author)
  const resolvedAuthor = typeof authorId === 'object' && authorId !== null ? authorId.id : authorId
  const hasAuthor = resolvedAuthor !== undefined && resolvedAuthor !== null

  const bodyRaw =
    typeof data.body === 'string' ? data.body : ((originalDoc?.body as string | undefined) ?? '')
  const bodyNorm = normalizeText(bodyRaw)

  const rules = await req.payload.find({
    collection: 'comment-moderation-rules',
    limit: 500,
    pagination: false,
    depth: 0,
    req,
    overrideAccess: true,
  })

  for (const rule of rules.docs as ModerationRuleDoc[]) {
    if (rule.ruleType === 'blockedUser' && hasAuthor) {
      const blockedId =
        typeof rule.blockedUser === 'object' && rule.blockedUser !== null
          ? rule.blockedUser.id
          : rule.blockedUser
      if (
        blockedId !== undefined &&
        blockedId !== null &&
        Number(blockedId) === Number(resolvedAuthor)
      ) {
        throw new APIError('Tài khoản của bạn không được phép bình luận.', 403)
      }
    }
    if (rule.ruleType === 'blockedKeyword' && rule.keyword) {
      const phrases = rule.keyword
        .split(/\r?\n/)
        .map((line) => normalizeText(line))
        .filter(Boolean)
      for (const kw of phrases) {
        if (kw && bodyNorm.includes(kw)) {
          data.status = 'rejected'
          data.rejectionReason = 'blocked_keyword'
          return data
        }
      }
    }
  }

  // Chỉ tự đặt 'approved' khi TẠO MỚI. Trên update KHÔNG hạ pending/rejected
  // (do admin đặt) xuống approved — nếu không, member sửa comment của mình sẽ tự
  // re-approve (moderation bypass). Keyword check ở trên vẫn áp cho cả update.
  if (operation === 'create' && !(req.user && isUsersCollectionAdmin(req.user))) {
    data.status = 'approved'
    data.rejectionReason = null
  }
  return data
}

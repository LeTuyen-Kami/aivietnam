'use client'

import React, { startTransition, useEffect, useOptimistic, useRef, useState } from 'react'

import * as Dialog from '@radix-ui/react-dialog'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { Flag, X } from 'lucide-react'

import { useAuth } from '@/providers/Auth'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CommentTextClamp } from '@/components/Auth/CommentTextClamp'
import { cn } from '@/utilities/ui'

/** Strong ease-out — responsive first frame (animations.dev / Emil-style UI) */
const EASE_OUT = [0.23, 1, 0.32, 1] as const

type CommentDoc = {
  id: number
  body: string
  status: string
  createdAt: string
  author: { id: number; name: string | null } | null
  likeCount: number
  likedByMe: boolean
  parentCommentId: number | null
  myReaction: ReactionType | null
  reactionSummary: Partial<Record<ReactionType, number>>
  replies?: CommentDoc[]
}

type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'

type CommentsPage = {
  docs: CommentDoc[]
  approvedCount: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

type OptimisticReactionAction =
  | { type: 'set'; commentId: number; reaction: ReactionType | null }
  | { type: 'clear'; commentId: number }

const PAGE_SIZE = 5
const REACTIONS: Array<{ type: ReactionType; label: string; emoji: string }> = [
  { type: 'like', label: 'Thích', emoji: '👍' },
  { type: 'love', label: 'Yêu thích', emoji: '❤️' },
  { type: 'haha', label: 'Haha', emoji: '😆' },
  { type: 'wow', label: 'Wow', emoji: '😮' },
  { type: 'sad', label: 'Buồn', emoji: '😢' },
  { type: 'angry', label: 'Phẫn nộ', emoji: '😡' },
]

export type CommentSort = 'newest' | 'popular'

const commentsQueryKey = (postId: number) => ['site-comments', postId] as const

function applyReactionPreview(
  comment: CommentDoc,
  nextReaction: ReactionType | null,
): Pick<CommentDoc, 'myReaction' | 'likedByMe' | 'likeCount' | 'reactionSummary'> {
  const prevReaction = comment.myReaction
  const reactionSummary: Partial<Record<ReactionType, number>> = {
    ...(comment.reactionSummary ?? {}),
  }

  if (prevReaction) {
    reactionSummary[prevReaction] = Math.max(0, (reactionSummary[prevReaction] ?? 0) - 1)
  }

  if (nextReaction) {
    reactionSummary[nextReaction] = (reactionSummary[nextReaction] ?? 0) + 1
  }

  const likeCount = Object.values(reactionSummary).reduce((sum, count) => sum + (count ?? 0), 0)

  return {
    myReaction: nextReaction,
    likedByMe: nextReaction === 'like',
    likeCount,
    reactionSummary,
  }
}

function withOptimisticReactions(
  comments: CommentDoc[],
  overrides: Record<number, ReactionType | null>,
): CommentDoc[] {
  return comments.map((comment) => {
    const reactionOverride = Object.prototype.hasOwnProperty.call(overrides, comment.id)
      ? overrides[comment.id]
      : undefined
    const nextComment =
      reactionOverride === undefined
        ? comment
        : {
            ...comment,
            ...applyReactionPreview(comment, reactionOverride),
          }

    const nextReplies = (nextComment.replies ?? []).map((reply) => {
      const replyOverride = Object.prototype.hasOwnProperty.call(overrides, reply.id)
        ? overrides[reply.id]
        : undefined
      return replyOverride === undefined
        ? reply
        : {
            ...reply,
            ...applyReactionPreview(reply, replyOverride),
          }
    })

    return {
      ...nextComment,
      replies: nextReplies,
    }
  })
}

function findCommentById(comments: CommentDoc[], commentId: number): CommentDoc | null {
  for (const comment of comments) {
    if (comment.id === commentId) return comment
    for (const reply of comment.replies ?? []) {
      if (reply.id === commentId) return reply
    }
  }
  return null
}

async function fetchCommentsPage(
  postId: number,
  page: number,
  sort: CommentSort,
): Promise<CommentsPage> {
  const params = new URLSearchParams({
    postId: String(postId),
    page: String(page),
    limit: String(PAGE_SIZE),
    sort: sort === 'popular' ? 'popular' : 'newest',
  })
  const res = await fetch(`/api/site-comments?${params}`, { credentials: 'include' })
  if (!res.ok) {
    throw new Error('Không tải được bình luận')
  }
  const data = (await res.json()) as {
    docs?: CommentDoc[]
    approvedCount?: number
    totalPages?: number
    hasNextPage?: boolean
    hasPrevPage?: boolean
  }
  return {
    docs: (data.docs ?? []).map((row) => {
      const d = row as CommentDoc
      return {
        ...d,
        likeCount: typeof d.likeCount === 'number' ? d.likeCount : 0,
        likedByMe: Boolean(d.likedByMe),
        parentCommentId: typeof d.parentCommentId === 'number' ? d.parentCommentId : null,
        myReaction: typeof d.myReaction === 'string' ? (d.myReaction as ReactionType) : null,
        reactionSummary:
          d.reactionSummary && typeof d.reactionSummary === 'object'
            ? (d.reactionSummary as Partial<Record<ReactionType, number>>)
            : {},
        replies: Array.isArray(d.replies)
          ? d.replies.map((reply) => ({
              ...reply,
              likeCount: typeof reply.likeCount === 'number' ? reply.likeCount : 0,
              likedByMe: Boolean(reply.likedByMe),
              parentCommentId:
                typeof reply.parentCommentId === 'number' ? reply.parentCommentId : d.id,
              myReaction:
                typeof reply.myReaction === 'string' ? (reply.myReaction as ReactionType) : null,
              reactionSummary:
                reply.reactionSummary && typeof reply.reactionSummary === 'object'
                  ? (reply.reactionSummary as Partial<Record<ReactionType, number>>)
                  : {},
            }))
          : [],
      }
    }),
    approvedCount: typeof data.approvedCount === 'number' ? data.approvedCount : 0,
    totalPages: Math.max(1, data.totalPages ?? 1),
    hasNextPage: Boolean(data.hasNextPage),
    hasPrevPage: Boolean(data.hasPrevPage),
  }
}

function CommentBody({ c }: { c: CommentDoc }) {
  const authorName = c.author?.name || 'Thành viên'
  const authorSubline = c.author?.id ? `${String(c.author.id)}` : 'Khách'
  const avatarText = authorName.trim().charAt(0).toUpperCase() || 'U'

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
        {avatarText}
      </div>
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-muted px-3 py-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-foreground">{authorName}</span>
            <span className="text-muted-foreground">{authorSubline}</span>
          </div>
          <CommentTextClamp className="mt-1 text-sm text-foreground" maxLines={3} text={c.body} />
        </div>
        {c.status === 'pending' ? (
          <span className="mt-1 inline-block rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
            Chờ duyệt
          </span>
        ) : null}
        {c.status === 'rejected' ? (
          <span className="mt-1 inline-block rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] uppercase text-destructive">
            Từ chối
          </span>
        ) : null}
      </div>
    </div>
  )
}

const pressable =
  'active:scale-[0.98] motion-safe:transition-transform motion-safe:duration-100 motion-safe:ease-out'

function CommentActionRow({
  comment,
  user,
  openAuthModal,
  reactionPending,
  onReact,
  onReply,
  onReport,
}: {
  comment: CommentDoc
  user: unknown
  openAuthModal: () => void
  reactionPending: boolean
  onReact: (reaction: ReactionType) => void
  onReply?: () => void
  onReport?: () => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const hideTimerRef = useRef<number | null>(null)

  const myReaction = comment.myReaction
  const activeReaction = REACTIONS.find((item) => item.type === myReaction)
  const totalReactions = Object.values(comment.reactionSummary ?? {}).reduce(
    (sum, count) => sum + (count ?? 0),
    0,
  )

  const openPicker = () => {
    if (hideTimerRef.current != null) {
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
    setPickerOpen(true)
  }

  const closePickerWithDelay = () => {
    if (hideTimerRef.current != null) {
      window.clearTimeout(hideTimerRef.current)
    }
    hideTimerRef.current = window.setTimeout(() => {
      setPickerOpen(false)
      hideTimerRef.current = null
    }, 120)
  }

  useEffect(() => {
    return () => {
      if (hideTimerRef.current != null) {
        window.clearTimeout(hideTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3 pl-13 text-xs">
      <div
        className="relative"
        onMouseEnter={openPicker}
        onMouseLeave={closePickerWithDelay}
        onFocus={openPicker}
        onBlur={closePickerWithDelay}
      >
        <button
          type="button"
          className={cn(
            pressable,
            'inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-rose-600 cursor-pointer',
            myReaction && 'text-rose-600',
          )}
          onClick={() => {
            if (!user) return openAuthModal()
            onReact('like')
          }}
        >
          {activeReaction ? <span className="leading-none">{activeReaction.emoji}</span> : null}
          <span>{activeReaction?.label ?? 'Thích'}</span>
          {totalReactions > 0 ? (
            <span className="tabular-nums text-[11px] text-muted-foreground">{totalReactions}</span>
          ) : null}
        </button>
        <AnimatePresence>
          {pickerOpen && (
            <motion.div
              key="picker"
              initial={{ opacity: 0.5, scale: 0.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0.5, scale: 0.1 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'absolute -top-12 left-0 z-20 rounded-full border border-border bg-background px-1.5 py-1 shadow-lg transition duration-150 origin-bottom-left',
              )}
            >
              <div className="flex items-center gap-1">
                {REACTIONS.map(({ type, label, emoji }) => (
                  <button
                    key={`${comment.id}-${type}`}
                    type="button"
                    disabled={reactionPending}
                    className={cn(
                      pressable,
                      'flex h-8 w-8 items-center justify-center rounded-full text-base hover:bg-muted cursor-pointer',
                      myReaction === type && 'bg-muted',
                    )}
                    aria-label={label}
                    title={label}
                    onClick={() => {
                      if (!user) return openAuthModal()
                      onReact(type)
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {onReply ? (
        <button
          type="button"
          className={cn(pressable, 'font-medium text-muted-foreground hover:text-foreground')}
          onClick={onReply}
        >
          Trả lời
        </button>
      ) : null}

      {onReport ? (
        <button
          type="button"
          className={cn(pressable, 'text-muted-foreground hover:text-destructive')}
          onClick={onReport}
        >
          <Flag className="mr-1 inline h-3.5 w-3.5" />
        </button>
      ) : null}

      <time className="ml-auto text-[11px] text-muted-foreground" dateTime={comment.createdAt}>
        {new Date(comment.createdAt).toLocaleString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </time>
    </div>
  )
}

export const PostComments: React.FC<{ postId: number }> = ({ postId }) => {
  const { user, loading, openAuthModal } = useAuth()
  const queryClient = useQueryClient()
  const reduceMotion = useReducedMotion()

  const listIntroDoneRef = useRef(false)

  const [body, setBody] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [messageTone, setMessageTone] = useState<'muted' | 'success'>('muted')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<CommentSort>('newest')
  const [highlightId, setHighlightId] = useState<number | null>(null)
  const [replyingToId, setReplyingToId] = useState<number | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [reportingId, setReportingId] = useState<number | null>(null)
  const [reportReason, setReportReason] = useState('spam')
  const [reportDetails, setReportDetails] = useState('')
  const [reportFeedback, setReportFeedback] = useState<string | null>(null)

  const { data, isPending, isFetching, isPlaceholderData, isError, error } = useQuery({
    queryKey: [...commentsQueryKey(postId), sort, page],
    queryFn: () => fetchCommentsPage(postId, page, sort),
    placeholderData: keepPreviousData,
  })

  useEffect(() => {
    listIntroDoneRef.current = false
    setSort('newest')
    setPage(1)
  }, [postId])

  useEffect(() => {
    if (highlightId == null) return
    const t = window.setTimeout(() => setHighlightId(null), 2000)
    return () => window.clearTimeout(t)
  }, [highlightId])

  const submitMutation = useMutation({
    mutationFn: async ({ text, parentCommentId }: { text: string; parentCommentId?: number }) => {
      const res = await fetch('/api/site-comments', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, body: text, parentCommentId }),
      })
      const payload = (await res.json().catch(() => ({}))) as {
        error?: string
        doc?: CommentDoc
      }
      if (!res.ok) {
        throw new Error(payload.error ?? 'Không gửi được bình luận')
      }
      return payload
    },
    onSuccess: (payload) => {
      setBody('')
      setReplyBody('')
      setReplyingToId(null)
      if (payload.doc?.status === 'rejected') {
        setMessageTone('muted')
        setMessage('Bình luận không được đăng do nội dung không phù hợp quy tắc kiểm duyệt.')
      } else {
        setMessage(null)
      }
      if (payload.doc?.id != null) {
        setHighlightId(payload.doc.id)
      }
      setSort('newest')
      setPage(1)
      void queryClient.invalidateQueries({ queryKey: commentsQueryKey(postId) })
    },
  })

  const reactionMutation = useMutation({
    mutationFn: async ({
      commentId,
      reaction,
    }: {
      commentId: number
      reaction: ReactionType | null
    }) => {
      const res = await fetch('/api/site-comments/reaction', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, reaction }),
      })

      const payload = (await res.json().catch(() => ({}))) as {
        error?: string
        myReaction?: ReactionType | null
        reactionSummary?: Partial<Record<ReactionType, number>>
      }

      if (!res.ok) {
        throw new Error(payload.error ?? 'Không cập nhật được cảm xúc')
      }

      return {
        myReaction: payload.myReaction ?? null,
        reactionSummary: payload.reactionSummary ?? {},
      }
    },

    // 🔥 OPTIMISTIC UPDATE CHUẨN
    onMutate: async ({ commentId, reaction }) => {
      const queryKey = [...commentsQueryKey(postId), sort, page]

      await queryClient.cancelQueries({ queryKey })

      const previousData = queryClient.getQueryData<CommentsPage>(queryKey)

      queryClient.setQueryData<CommentsPage>(queryKey, (old) => {
        if (!old) return old

        return {
          ...old,
          docs: old.docs.map((comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                ...applyReactionPreview(comment, reaction),
              }
            }

            return {
              ...comment,
              replies: (comment.replies ?? []).map((reply) =>
                reply.id === commentId
                  ? {
                      ...reply,
                      ...applyReactionPreview(reply, reaction),
                    }
                  : reply,
              ),
            }
          }),
        }
      })

      return { previousData, queryKey }
    },

    // ❌ rollback nếu lỗi
    onError: (_err, _vars, context) => {
      if (context?.previousData && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousData)
      }
    },

    // ✅ sync lại từ server
    onSuccess: (result, vars) => {
      const queryKey = [...commentsQueryKey(postId), sort, page]

      const nextLikeCount = Object.values(result.reactionSummary).reduce(
        (sum, count) => sum + (count ?? 0),
        0,
      )

      queryClient.setQueryData<CommentsPage>(queryKey, (old) => {
        if (!old) return old

        return {
          ...old,
          docs: old.docs.map((comment) => {
            if (comment.id === vars.commentId) {
              return {
                ...comment,
                likeCount: nextLikeCount,
                myReaction: result.myReaction,
                likedByMe: result.myReaction === 'like',
                reactionSummary: result.reactionSummary,
              }
            }

            return {
              ...comment,
              replies: (comment.replies ?? []).map((reply) =>
                reply.id === vars.commentId
                  ? {
                      ...reply,
                      likeCount: nextLikeCount,
                      myReaction: result.myReaction,
                      likedByMe: result.myReaction === 'like',
                      reactionSummary: result.reactionSummary,
                    }
                  : reply,
              ),
            }
          }),
        }
      })
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: commentsQueryKey(postId) })
    },
  })

  const reportMutation = useMutation({
    mutationFn: async ({
      commentId,
      reason,
      details,
    }: {
      commentId: number
      reason: string
      details: string
    }) => {
      const res = await fetch('/api/site-comments/report', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, reason, details }),
      })
      const payload = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(payload.error ?? 'Không gửi được báo cáo')
      return true
    },
    onSuccess: () => {
      setReportReason('spam')
      setReportDetails('')
      setReportFeedback('Đã gửi báo cáo thành công. Cảm ơn bạn!')
      setMessageTone('success')
      setMessage('Đã gửi báo cáo bình luận. Cảm ơn bạn!')
      window.setTimeout(() => {
        setReportingId(null)
        setReportFeedback(null)
      }, 1100)
    },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      openAuthModal()
      return
    }
    const text = body.trim()
    if (!text) return
    setMessage(null)
    setMessageTone('muted')
    submitMutation.mutate({ text })
  }

  const submitReply = (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyingToId) return
    if (!user) {
      openAuthModal()
      return
    }
    const text = replyBody.trim()
    if (!text) return
    setMessage(null)
    setMessageTone('muted')
    submitMutation.mutate({ text, parentCommentId: replyingToId })
  }

  const submitReport = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reportingId) return
    if (!user) {
      openAuthModal()
      return
    }
    reportMutation.mutate({
      commentId: reportingId,
      reason: reportReason,
      details: reportDetails.trim(),
    })
  }

  const docs = data?.docs ?? []
  const approvedCount = data?.approvedCount ?? 0
  const totalPages = data?.totalPages ?? 1
  const hasNextPage = data?.hasNextPage ?? false
  const hasPrevPage = data?.hasPrevPage ?? false

  const showEmpty = !isPending && docs.length === 0
  const showPagination = !isPending && docs.length > 0 && totalPages > 1
  const listPagingOverlay = isFetching && isPlaceholderData

  const rowClass = (c: CommentDoc) =>
    cn(
      'border-b border-border pb-4 transition-shadow duration-300 ease-out last:border-0',
      highlightId === c.id &&
        'rounded-md shadow-[0_0_0_2px_hsl(var(--primary)/0.38)] ring-offset-2 ring-offset-background',
    )

  const showCommentList = !isPending && !isError && !showEmpty

  const reactToComment = (commentId: number, reaction: ReactionType) => {
    const currentComment = findCommentById(docs, commentId)
    const nextReaction = currentComment?.myReaction === reaction ? null : reaction

    reactionMutation.mutate({
      commentId,
      reaction: nextReaction,
    })
  }

  return (
    <section className="mt-10 border-t border-border pt-6">
      <motion.h2
        className="text-base font-semibold"
        initial={reduceMotion ? false : { opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.2, ease: EASE_OUT }}
      >
        Ý kiến ({approvedCount})
      </motion.h2>

      <form className="mt-3 space-y-2" onSubmit={submit}>
        <Textarea
          aria-label="Nhập ý kiến"
          className="min-h-20 resize-y"
          placeholder={
            loading ? 'Đang tải…' : user ? 'Chia sẻ ý kiến của bạn' : 'Đăng nhập để bình luận'
          }
          value={body}
          onChange={(e) => setBody(e.target.value)}
          readOnly={!user && !loading}
          onClick={() => {
            if (!loading && !user) openAuthModal()
          }}
        />
        <div className="flex flex-wrap items-center gap-2">
          {user ? (
            <Button
              className={pressable}
              disabled={submitMutation.isPending || !body.trim()}
              size="sm"
              type="submit"
            >
              {submitMutation.isPending ? 'Đang gửi…' : 'Gửi ý kiến'}
            </Button>
          ) : (
            <Button
              className={pressable}
              disabled={loading}
              size="sm"
              type="button"
              variant="secondary"
              onClick={openAuthModal}
            >
              Đăng nhập để bình luận
            </Button>
          )}
        </div>
      </form>

      {submitMutation.isError ? (
        <p className="mt-2 text-sm text-destructive">
          {submitMutation.error instanceof Error
            ? submitMutation.error.message
            : 'Lỗi gửi bình luận'}
        </p>
      ) : null}
      {message ? (
        <p
          className={cn(
            'mt-2 text-sm',
            messageTone === 'success' ? 'font-medium text-emerald-600' : 'text-muted-foreground',
          )}
        >
          {message}
        </p>
      ) : null}

      {!isPending && !isError && approvedCount > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Sắp xếp:</span>
          <Button
            className={pressable}
            size="sm"
            type="button"
            variant={sort === 'newest' ? 'default' : 'outline'}
            onClick={() => {
              setSort('newest')
              setPage(1)
            }}
          >
            Mới nhất
          </Button>
          <Button
            className={pressable}
            size="sm"
            type="button"
            variant={sort === 'popular' ? 'default' : 'outline'}
            onClick={() => {
              setSort('popular')
              setPage(1)
            }}
          >
            Quan tâm nhất
          </Button>
        </div>
      ) : null}

      {reactionMutation.isError ? (
        <p className="mt-2 text-sm text-destructive">
          {reactionMutation.error instanceof Error
            ? reactionMutation.error.message
            : 'Không cập nhật được cảm xúc'}
        </p>
      ) : null}
      {reportMutation.isError ? (
        <p className="mt-2 text-sm text-destructive">
          {reportMutation.error instanceof Error
            ? reportMutation.error.message
            : 'Không gửi được báo cáo'}
        </p>
      ) : null}

      <div className="relative mt-6 min-h-12">
        <AnimatePresence mode="wait">
          {isPending ? (
            <motion.p
              key="loading"
              className="text-center text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: {
                  duration: reduceMotion ? 0 : 0.16,
                  ease: EASE_OUT,
                },
              }}
            >
              Đang tải bình luận…
            </motion.p>
          ) : isError ? (
            <motion.p
              key="error"
              className="text-center text-sm text-destructive"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: reduceMotion ? 0 : 0.18,
                ease: EASE_OUT,
              }}
            >
              {error instanceof Error ? error.message : 'Không tải được bình luận'}
            </motion.p>
          ) : showEmpty ? (
            <motion.p
              key="empty"
              className="text-center text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: {
                  duration: reduceMotion ? 0 : 0.16,
                  ease: EASE_OUT,
                },
              }}
            >
              Chưa có bình luận nào. Hãy để lại ý kiến của bạn!
            </motion.p>
          ) : showCommentList ? (
            <motion.div
              key={`list-${sort}`}
              className="space-y-4"
              initial={reduceMotion || listIntroDoneRef.current ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduceMotion ? 0 : 0.22,
                ease: EASE_OUT,
              }}
              onAnimationComplete={() => {
                listIntroDoneRef.current = true
              }}
            >
              {docs.map((c, index) => (
                <motion.article
                  key={c.id}
                  className={rowClass(c)}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.22,
                    ease: EASE_OUT,
                    delay: index * 0.05,
                  }}
                >
                  <div className="min-w-0">
                    <CommentBody c={c} />
                    <CommentActionRow
                      comment={c}
                      openAuthModal={openAuthModal}
                      reactionPending={reactionMutation.isPending}
                      user={user}
                      onReact={(reaction) => reactToComment(c.id, reaction)}
                      onReply={() => {
                        if (!user) return openAuthModal()
                        setReplyingToId(c.id)
                        setReportDetails('')
                      }}
                      onReport={() => {
                        if (!user) return openAuthModal()
                        setReportingId(c.id)
                        setReportReason('spam')
                        setReportDetails('')
                        setReportFeedback(null)
                        setReplyingToId(null)
                      }}
                    />

                    {replyingToId === c.id ? (
                      <form
                        className="mt-3 space-y-2 rounded-md border border-border p-3"
                        onSubmit={submitReply}
                      >
                        <Textarea
                          className="min-h-16"
                          placeholder="Nhập bình luận trả lời..."
                          value={replyBody}
                          onChange={(e) => setReplyBody(e.target.value)}
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            className={pressable}
                            size="sm"
                            type="submit"
                            disabled={submitMutation.isPending || !replyBody.trim()}
                          >
                            {submitMutation.isPending ? 'Đang gửi…' : 'Gửi'}
                          </Button>
                          <Button
                            className={pressable}
                            size="sm"
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setReplyingToId(null)
                              setReplyBody('')
                            }}
                          >
                            Hủy
                          </Button>
                        </div>
                      </form>
                    ) : null}

                    {(c.replies?.length ?? 0) > 0 ? (
                      <div className="mt-3 space-y-3 border-l border-border pl-4">
                        {c.replies?.map((reply) => (
                          <article
                            key={reply.id}
                            className="rounded-md border border-border/60 p-3"
                          >
                            <CommentBody c={reply} />
                            <CommentActionRow
                              comment={reply}
                              openAuthModal={openAuthModal}
                              reactionPending={reactionMutation.isPending}
                              user={user}
                              onReact={(reaction) => reactToComment(reply.id, reaction)}
                            />
                          </article>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </motion.article>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {listPagingOverlay ? (
            <motion.div
              key="overlay"
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 top-0 flex items-center justify-center bg-background/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.14, ease: EASE_OUT }}
            >
              <span className="text-xs text-muted-foreground">Đang tải…</span>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {showPagination ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            Trang {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              className={pressable}
              disabled={!hasPrevPage || isFetching}
              size="sm"
              type="button"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </Button>
            <Button
              className={pressable}
              disabled={!hasNextPage || isFetching}
              size="sm"
              type="button"
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog.Root
        open={reportingId != null}
        onOpenChange={(open) => {
          if (!open) {
            setReportingId(null)
            setReportReason('spam')
            setReportDetails('')
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(100vw-2rem,460px)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-5 shadow-lg outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
            <div className="mb-4 flex items-start justify-between gap-2">
              <Dialog.Title className="text-lg font-semibold text-foreground">
                Báo cáo vi phạm
              </Dialog.Title>
              <Dialog.Close
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Đóng"
              >
                <X className="size-4" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="mb-4 text-sm text-muted-foreground">
              Chọn lý do và mô tả thêm để gửi báo cáo bình luận.
            </Dialog.Description>

            <form className="space-y-3" onSubmit={submitReport}>
              {reportFeedback ? (
                <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                  {reportFeedback}
                </p>
              ) : null}
              <select
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              >
                <option value="spam">Spam/quảng cáo</option>
                <option value="abuse">Nội dung xúc phạm</option>
                <option value="misinfo">Thông tin sai lệch</option>
                <option value="other">Khác</option>
              </select>

              <Textarea
                className="min-h-20"
                placeholder="Chi tiết thêm (không bắt buộc)"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
              />

              <div className="flex items-center justify-end gap-2">
                <Button
                  className={pressable}
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setReportingId(null)
                    setReportReason('spam')
                    setReportDetails('')
                    setReportFeedback(null)
                  }}
                >
                  Hủy
                </Button>
                <Button
                  className={pressable}
                  size="sm"
                  type="submit"
                  disabled={reportMutation.isPending || reportingId == null}
                >
                  {reportMutation.isPending ? 'Đang gửi…' : 'Gửi báo cáo'}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  )
}

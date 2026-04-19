'use client'

import React, { useEffect, useRef, useState } from 'react'

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { Heart } from 'lucide-react'

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
}

type CommentsPage = {
  docs: CommentDoc[]
  approvedCount: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

const PAGE_SIZE = 5

export type CommentSort = 'newest' | 'popular'

const commentsQueryKey = (postId: number) => ['site-comments', postId] as const

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
      }
    }),
    approvedCount: typeof data.approvedCount === 'number' ? data.approvedCount : 0,
    totalPages: Math.max(1, data.totalPages ?? 1),
    hasNextPage: Boolean(data.hasNextPage),
    hasPrevPage: Boolean(data.hasPrevPage),
  }
}

function CommentBody({ c }: { c: CommentDoc }) {
  return (
    <>
      <div className="flex flex-wrap items-baseline gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{c.author?.name || 'Thành viên'}</span>
        <time dateTime={c.createdAt}>
          {new Date(c.createdAt).toLocaleString('vi-VN', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </time>
        {c.status === 'pending' ? (
          <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase">
            Chờ duyệt
          </span>
        ) : null}
        {c.status === 'rejected' ? (
          <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] uppercase text-destructive">
            Từ chối
          </span>
        ) : null}
      </div>
      <CommentTextClamp className="text-foreground" maxLines={3} text={c.body} />
    </>
  )
}

const pressable =
  'active:scale-[0.98] motion-safe:transition-transform motion-safe:duration-100 motion-safe:ease-out'

export const PostComments: React.FC<{ postId: number }> = ({ postId }) => {
  const { user, loading, openAuthModal } = useAuth()
  const queryClient = useQueryClient()
  const reduceMotion = useReducedMotion()

  const listIntroDoneRef = useRef(false)

  const [body, setBody] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<CommentSort>('newest')
  const [highlightId, setHighlightId] = useState<number | null>(null)

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
    mutationFn: async (text: string) => {
      const res = await fetch('/api/site-comments', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, body: text }),
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
      if (payload.doc?.status === 'rejected') {
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

  const likeMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const res = await fetch('/api/site-comments/like', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      })
      const payload = (await res.json().catch(() => ({}))) as {
        error?: string
        liked?: boolean
        likeCount?: number
      }
      if (!res.ok) {
        throw new Error(payload.error ?? 'Không cập nhật được thích')
      }
      return {
        liked: Boolean(payload.liked),
        likeCount: typeof payload.likeCount === 'number' ? payload.likeCount : 0,
      }
    },
    onSuccess: (result, commentId) => {
      queryClient.setQueryData(
        [...commentsQueryKey(postId), sort, page],
        (old: CommentsPage | undefined) => {
          if (!old) return old
          return {
            ...old,
            docs: old.docs.map((row) =>
              row.id === commentId
                ? { ...row, likeCount: result.likeCount, likedByMe: result.liked }
                : row,
            ),
          }
        },
      )
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
    submitMutation.mutate(text)
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
      {message ? <p className="mt-2 text-sm text-muted-foreground">{message}</p> : null}

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

      {likeMutation.isError ? (
        <p className="mt-2 text-sm text-destructive">
          {likeMutation.error instanceof Error
            ? likeMutation.error.message
            : 'Không cập nhật được thích'}
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
                  <div className="flex gap-3">
                    <div className="min-w-0 flex-1">
                      <CommentBody c={c} />
                    </div>
                    <div className="shrink-0 pt-0.5">
                      <button
                        type="button"
                        className={cn(
                          pressable,
                          'inline-flex flex-col items-center gap-0.5 rounded-md px-1.5 py-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground',
                          c.likedByMe && 'text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300',
                        )}
                        aria-label={c.likedByMe ? 'Bỏ thích bình luận' : 'Thích bình luận'}
                        aria-pressed={c.likedByMe}
                        disabled={likeMutation.isPending}
                        onClick={() => {
                          if (!user) {
                            openAuthModal()
                            return
                          }
                          likeMutation.mutate(c.id)
                        }}
                      >
                        <Heart
                          className={cn(
                            'h-4 w-4 shrink-0',
                            c.likedByMe && 'fill-current',
                            likeMutation.isPending && 'opacity-60',
                          )}
                        />
                        <span className="tabular-nums text-[11px] font-medium leading-none">
                          {c.likeCount}
                        </span>
                      </button>
                    </div>
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
    </section>
  )
}

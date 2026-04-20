'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Heart, MessageCircle } from 'lucide-react'

import { useAuth } from '@/providers/Auth'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/utilities/ui'

type LivestreamComment = {
  id: number
  body: string
  status: string
  createdAt: string
  author: { id: number; name: string | null } | null
  likeCount: number
  likedByMe: boolean
}

type LivestreamCommentsResponse = {
  docs: LivestreamComment[]
}

function commentsKey(slug: string) {
  return ['livestream-comments', slug] as const
}

function authorInitial(name: string | null | undefined): string {
  const t = (name ?? 'M').trim()
  return t.slice(0, 1).toUpperCase()
}

async function fetchLivestreamComments(slug: string): Promise<LivestreamCommentsResponse> {
  const params = new URLSearchParams({ slug, limit: '30' })
  const res = await fetch(`/api/livestream-comments?${params.toString()}`, {
    credentials: 'include',
    cache: 'no-store',
  })

  if (!res.ok) {
    if (res.status === 401) return { docs: [] }
    throw new Error('Không tải được bình luận livestream')
  }

  const data = (await res.json()) as { docs?: LivestreamComment[] }
  return { docs: data.docs ?? [] }
}

export function LiveViewerEngagement({
  slug,
  isLive,
}: {
  slug: string
  isLive: boolean
}) {
  const { user, loading, openAuthModal } = useAuth()
  const queryClient = useQueryClient()
  const [body, setBody] = useState('')

  const query = useQuery({
    queryKey: commentsKey(slug),
    queryFn: () => fetchLivestreamComments(slug),
    enabled: Boolean(slug),
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
  })

  const docs = query.data?.docs ?? []
  const reversedDocs = useMemo(() => [...docs].reverse(), [docs])

  const createMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch('/api/livestream-comments', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, body: text }),
      })
      const payload = (await res.json().catch(() => ({}))) as {
        error?: string
      }
      if (!res.ok) {
        throw new Error(payload.error ?? 'Không gửi được bình luận')
      }
    },
    onSuccess: async () => {
      setBody('')
      await queryClient.invalidateQueries({ queryKey: commentsKey(slug) })
    },
  })

  const likeMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const res = await fetch('/api/livestream-comments/like', {
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
        throw new Error(payload.error ?? 'Không cập nhật được tim')
      }
      return {
        liked: Boolean(payload.liked),
        likeCount: typeof payload.likeCount === 'number' ? payload.likeCount : 0,
      }
    },
    onSuccess: (result, commentId) => {
      queryClient.setQueryData(commentsKey(slug), (prev: LivestreamCommentsResponse | undefined) => {
        if (!prev) return prev
        return {
          docs: prev.docs.map((comment) =>
            comment.id === commentId
              ? { ...comment, likedByMe: result.liked, likeCount: result.likeCount }
              : comment,
          ),
        }
      })
    },
  })

  const canSend = Boolean(user) && isLive

  return (
    <aside
      className={cn(
        'rounded-2xl border border-border/80 bg-muted/20 shadow-lg shadow-black/5',
        'ring-1 ring-black/3 backdrop-blur-sm dark:bg-muted/10 dark:ring-white/10',
      )}
    >
      <div className="border-b border-border/60 px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MessageCircle className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Trò chuyện</h2>
              <p className="text-xs text-muted-foreground">
                {docs.length} bình luận{isLive ? '' : ' · chỉ gửi khi đang live'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            if (!user) {
              openAuthModal()
              return
            }
            const nextBody = body.trim()
            if (!nextBody || !isLive) return
            createMutation.mutate(nextBody)
          }}
        >
          <Textarea
            aria-label="Nhập bình luận livestream"
            className="min-h-[88px] resize-y border-border/80 bg-background/80 text-sm shadow-inner"
            placeholder={
              loading
                ? 'Đang tải...'
                : user
                  ? isLive
                    ? 'Viết bình luận...'
                    : 'Chỉ gửi bình luận khi livestream đang phát'
                  : 'Đăng nhập để bình luận'
            }
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onClick={() => {
              if (!loading && !user) openAuthModal()
            }}
            readOnly={!user || !isLive}
          />
          <Button
            className="w-full sm:w-auto"
            disabled={createMutation.isPending || !body.trim() || !canSend}
            size="sm"
            type="submit"
          >
            {createMutation.isPending ? 'Đang gửi…' : 'Gửi'}
          </Button>
        </form>

        {createMutation.isError ? (
          <p className="text-xs text-destructive">
            {createMutation.error instanceof Error ? createMutation.error.message : 'Lỗi gửi bình luận'}
          </p>
        ) : null}

        {query.isError ? (
          <p className="text-xs text-destructive">
            {query.error instanceof Error ? query.error.message : 'Không tải được bình luận livestream'}
          </p>
        ) : null}

        <div className="max-h-[min(22rem,55vh)] space-y-2 overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]">
          {query.isPending ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Đang tải bình luận…</p>
          ) : reversedDocs.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Chưa có bình luận. Hãy mở đầu cuộc trò chuyện.</p>
          ) : (
            reversedDocs.map((comment) => {
              const name = comment.author?.name || 'Thành viên'
              return (
                <article
                  key={comment.id}
                  className="rounded-xl border border-border/60 bg-background/60 p-3 shadow-sm transition-colors hover:bg-background/90"
                >
                  <div className="flex gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary/20 to-primary/5 text-xs font-semibold text-primary"
                      aria-hidden
                    >
                      {authorInitial(name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="truncate text-xs font-medium text-foreground">{name}</span>
                        <time className="text-[10px] text-muted-foreground" dateTime={comment.createdAt}>
                          {new Date(comment.createdAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </time>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-foreground/95">
                        {comment.body}
                      </p>
                    </div>
                    <button
                      aria-label={comment.likedByMe ? 'Bỏ tim bình luận' : 'Thả tim bình luận'}
                      className={cn(
                        'flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1 text-muted-foreground transition-colors',
                        'hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400',
                        comment.likedByMe && 'text-rose-600 dark:text-rose-400',
                      )}
                      disabled={likeMutation.isPending}
                      type="button"
                      onClick={() => {
                        if (!user) {
                          openAuthModal()
                          return
                        }
                        likeMutation.mutate(comment.id)
                      }}
                    >
                      <Heart className={cn('h-4 w-4', comment.likedByMe && 'fill-current')} />
                      <span className="tabular-nums text-[11px] font-medium">{comment.likeCount}</span>
                    </button>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </div>
    </aside>
  )
}

'use client'

import { Heart, Lock, MessageCircle, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  StreamChat,
  type Channel,
  type Event,
  type LocalMessage,
  type UserResponse,
} from 'stream-chat'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/providers/Auth'
import { cn } from '@/utilities/ui'

type LivestreamComment = {
  id: string
  body: string
  createdAt: string
  author: { id: string; name: string | null } | null
  likeCount: number
  likedByMe: boolean
}

type ChatTokenPayload = {
  token: string
  apiKey?: string
  user: {
    id: string
    name?: string
  }
  channel: {
    channelType: string
    channelId: string
    channelCid: string
  }
}

type ReplayPayload = {
  docs?: LivestreamComment[]
  hostStreamUserId?: string | null
}

function resolveHostStreamUserId(channel: Channel): string | null {
  const data = channel.data as Record<string, unknown> | undefined
  const createdBy = data?.created_by
  if (createdBy && typeof createdBy === 'object' && 'id' in createdBy) {
    const id = (createdBy as { id?: unknown }).id
    if (typeof id === 'string' && id.trim()) return id.trim()
  }

  const fromData = data?.created_by_id
  if (typeof fromData === 'string' && fromData.trim()) return fromData.trim()

  return null
}

const COMMENT_LIST_MASK =
  '[mask-image:linear-gradient(to_bottom,transparent_0%,black_22%,black_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_22%,black_100%)]'

function authorInitial(name: string | null | undefined): string {
  const t = (name ?? 'M').trim()
  return t.slice(0, 1).toUpperCase()
}

function mapMessageToComment(message: LocalMessage): LivestreamComment {
  const ownReactions = Array.isArray(message.own_reactions) ? message.own_reactions : []
  const likedByMe = ownReactions.some((reaction) => reaction.type === 'like')

  return {
    id: message.id,
    body: message.text ?? '',
    createdAt:
      typeof message.created_at === 'string'
        ? message.created_at
        : message.created_at
          ? message.created_at.toISOString()
          : new Date().toISOString(),
    author: message.user
      ? {
          id: message.user.id,
          name: message.user.name ?? null,
        }
      : null,
    likeCount: message.reaction_counts?.like ?? 0,
    likedByMe,
  }
}

function commentPlaceholder({
  loading,
  user,
  isLive,
  overlay,
}: {
  loading: boolean
  user: unknown
  isLive: boolean
  overlay: boolean
}): string {
  if (loading) return 'Đang tải...'
  if (!user) return 'Đăng nhập để bình luận'
  if (!isLive) return 'Chỉ gửi bình luận khi livestream đang phát'
  return overlay ? 'Nhập...' : 'Viết bình luận...'
}

function OverlayCommentRow({
  comment,
  hostStreamUserId,
}: {
  comment: LivestreamComment
  hostStreamUserId: string | null
}) {
  const name = comment.author?.name || 'Thành viên'
  const isHost = Boolean(hostStreamUserId && comment.author?.id === hostStreamUserId)

  return (
    <article className="flex max-w-[92%] items-start gap-1.5 [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]">
      <div
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-[10px] font-semibold text-white"
        aria-hidden
      >
        {authorInitial(name)}
      </div>
      <div className="min-w-0 rounded-xl bg-black/40 px-2 py-1">
        <div className="flex flex-col gap-1 text-xs leading-snug text-white">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] font-semibold text-white/60">{name}</span>
            {isHost ? (
              <span className="rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-medium leading-none text-white">
                Chủ phòng
              </span>
            ) : null}
          </div>
          <span className="font-normal text-white">{comment.body}</span>
        </div>
      </div>
    </article>
  )
}

export function LiveViewerEngagement({
  slug,
  isLive,
  overlay = false,
}: {
  slug: string
  isLive: boolean
  overlay?: boolean
}) {
  const { user, loading, openAuthModal } = useAuth()
  const [body, setBody] = useState('')
  const [channel, setChannel] = useState<Channel | null>(null)
  const [comments, setComments] = useState<LivestreamComment[]>([])
  const [queryError, setQueryError] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isTogglingLike, setIsTogglingLike] = useState(false)
  const [chatClient, setChatClient] = useState<StreamChat | null>(null)
  const [hostStreamUserId, setHostStreamUserId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const stickToBottomRef = useRef(true)

  useEffect(() => {
    if (!slug) return

    let active = true

    const loadReplay = async () => {
      setIsLoadingComments(true)
      setQueryError(null)
      try {
        const replayRes = await fetch(
          `/api/livestream-chat/replay?slug=${encodeURIComponent(slug)}&limit=40`,
          {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          },
        )
        const replayPayload = (await replayRes.json().catch(() => ({}))) as ReplayPayload & {
          error?: string
        }
        if (!replayRes.ok) {
          throw new Error(replayPayload.error ?? 'Không tải được bình luận livestream')
        }
        if (!active) return
        setComments(Array.isArray(replayPayload.docs) ? replayPayload.docs : [])
        if (
          typeof replayPayload.hostStreamUserId === 'string' &&
          replayPayload.hostStreamUserId.trim()
        ) {
          setHostStreamUserId(replayPayload.hostStreamUserId.trim())
        }
      } catch (error) {
        if (!active) return
        setQueryError(
          error instanceof Error ? error.message : 'Không tải được bình luận livestream',
        )
      } finally {
        if (active) setIsLoadingComments(false)
      }
    }

    void loadReplay()

    return () => {
      active = false
    }
  }, [slug])

  useEffect(() => {
    if (!slug || loading || !user) return

    let active = true
    let activeChannel: Channel | null = null
    let unsubscribe: (() => void) | null = null

    const setup = async () => {
      setQueryError(null)
      try {
        const tokenRes = await fetch('/api/stream/chat-token', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug }),
        })
        if (tokenRes.status === 401) {
          return
        }

        const tokenPayload = (await tokenRes.json().catch(() => ({}))) as {
          error?: string
        } & ChatTokenPayload
        if (!tokenRes.ok || !tokenPayload.token || !tokenPayload.apiKey) {
          throw new Error(tokenPayload.error ?? 'Không kết nối được chat livestream')
        }

        const chatClient = StreamChat.getInstance(tokenPayload.apiKey)
        const tokenProvider = async () => {
          const refreshRes = await fetch('/api/stream/chat-token', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug }),
          })
          const refreshPayload = (await refreshRes.json().catch(() => ({}))) as {
            token?: string
            error?: string
          }
          if (!refreshRes.ok || !refreshPayload.token) {
            throw new Error(refreshPayload.error ?? 'Không làm mới được token chat')
          }
          return refreshPayload.token
        }

        await chatClient.connectUser(tokenPayload.user as UserResponse, tokenProvider)
        const nextChannel = chatClient.channel(
          tokenPayload.channel.channelType,
          tokenPayload.channel.channelId,
        )
        await nextChannel.watch()

        if (!active) return
        setChatClient(chatClient)
        activeChannel = nextChannel
        setChannel(nextChannel)
        setComments(nextChannel.state.messages.map(mapMessageToComment))

        const subscription = nextChannel.on((event: Event) => {
          if (
            event.type === 'message.new' ||
            event.type === 'message.updated' ||
            event.type === 'message.deleted' ||
            event.type === 'reaction.new' ||
            event.type === 'reaction.deleted' ||
            event.type === 'reaction.updated'
          ) {
            setComments(nextChannel.state.messages.map(mapMessageToComment))
          }
        })
        unsubscribe = () => subscription.unsubscribe()
      } catch (error) {
        if (!active) return
        setQueryError(
          error instanceof Error ? error.message : 'Không tải được bình luận livestream',
        )
      }
    }

    void setup()

    return () => {
      active = false
      setChannel(null)
      if (unsubscribe) unsubscribe()
      if (activeChannel) {
        void activeChannel.stopWatching().catch(() => null)
      }
    }
  }, [loading, slug, user])

  useEffect(() => {
    return () => {
      if (chatClient) {
        void chatClient.disconnectUser().catch(() => null)
      }
    }
  }, [chatClient])

  useEffect(() => {
    if (!overlay) return
    const el = listRef.current
    if (!el) return

    const onScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      stickToBottomRef.current = distanceFromBottom < 48
    }

    onScroll()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [overlay])

  useEffect(() => {
    if (!overlay) return
    const el = listRef.current
    if (!el) return
    if (!stickToBottomRef.current) return

    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
    })
  }, [comments, overlay, isLoadingComments])

  const canSend = Boolean(user) && isLive
  const placeholder = commentPlaceholder({ loading, user, isLive, overlay })

  const sendMessage = async (text: string) => {
    if (!channel) throw new Error('Chat chưa sẵn sàng')
    setCreateError(null)
    setIsSending(true)
    try {
      await channel.sendMessage({ text })
      setBody('')
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Lỗi gửi bình luận')
    } finally {
      setIsSending(false)
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!user) {
      openAuthModal()
      return
    }
    const nextBody = body.trim()
    if (!nextBody || !isLive) return
    void sendMessage(nextBody)
  }

  const toggleLike = async (comment: LivestreamComment) => {
    if (!channel || !user) return
    setIsTogglingLike(true)
    try {
      if (comment.likedByMe) {
        await channel.deleteReaction(comment.id, 'like')
      } else {
        await channel.sendReaction(comment.id, { type: 'like' })
      }
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Không cập nhật được tim')
    } finally {
      setIsTogglingLike(false)
    }
  }

  const commentListContent = overlay ? (
    isLoadingComments ? (
      <p className="py-2 text-xs text-white/55">Đang tải bình luận…</p>
    ) : comments.length === 0 ? (
      <p className="py-2 text-xs text-white/55">Chưa có bình luận.</p>
    ) : (
      comments.map((comment) => (
        <OverlayCommentRow key={comment.id} comment={comment} hostStreamUserId={hostStreamUserId} />
      ))
    )
  ) : isLoadingComments ? (
    <p className="py-6 text-center text-xs text-white/55">Đang tải bình luận…</p>
  ) : comments.length === 0 ? (
    <p className="py-6 text-center text-xs text-white/55">Chưa có bình luận.</p>
  ) : (
    [...comments].reverse().map((comment) => {
      const name = comment.author?.name || 'Thành viên'
      return (
        <article
          key={comment.id}
          className="rounded-2xl border border-white/8 bg-black/30 p-3 shadow-lg shadow-black/10"
        >
          <div className="flex gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white ring-1 ring-white/10"
              aria-hidden
            >
              {authorInitial(name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="truncate text-xs font-medium text-white">{name}</span>
                <time className="text-[10px] text-white/45" dateTime={comment.createdAt}>
                  {new Date(comment.createdAt).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-white/88">
                {comment.body}
              </p>
            </div>
            <button
              aria-label={comment.likedByMe ? 'Bỏ tim bình luận' : 'Thả tim bình luận'}
              className={cn(
                'flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-white/50 transition-colors',
                user && 'hover:bg-rose-500/10 hover:text-rose-300',
                comment.likedByMe && user && 'text-rose-300',
              )}
              disabled={isTogglingLike || !channel || !user}
              type="button"
              onClick={() => {
                if (!user) {
                  openAuthModal()
                  return
                }
                void toggleLike(comment)
              }}
            >
              <Heart className={cn('h-4 w-4', comment.likedByMe && user && 'fill-current')} />
              <span className="tabular-nums text-[11px] font-medium">{comment.likeCount}</span>
            </button>
          </div>
        </article>
      )
    })
  )

  if (overlay) {
    return (
      <aside className="flex w-full flex-col text-white">
        <div
          ref={listRef}
          className={cn(
            'max-h-[32svh] touch-pan-y overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:none] sm:max-h-[36svh] [&::-webkit-scrollbar]:hidden',
            COMMENT_LIST_MASK,
          )}
        >
          <div className="flex min-h-[32svh] flex-col justify-end gap-1.5 sm:min-h-[36svh]">
            {commentListContent}
          </div>
        </div>

        {createError ? <p className="mt-1 text-xs text-rose-300">{createError}</p> : null}
        {queryError ? <p className="mt-1 text-xs text-rose-300">{queryError}</p> : null}

        <form className="mt-2 flex shrink-0 items-center gap-2" onSubmit={handleSubmit}>
          <Input
            aria-label="Nhập bình luận livestream"
            className="h-10 min-w-0 flex-1 rounded-full border-white/15 bg-black/45 text-sm text-white shadow-none placeholder:text-white/50 focus-visible:border-white/25 focus-visible:ring-white/15"
            placeholder={placeholder}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onClick={() => {
              if (!loading && !user) openAuthModal()
            }}
            readOnly={!user || !isLive}
            disabled={isSending}
          />
          <Button
            aria-label={!user ? 'Đăng nhập để chat' : isSending ? 'Đang gửi' : 'Gửi bình luận'}
            className="h-10 shrink-0 rounded-full bg-white px-3 text-black hover:bg-white/90 disabled:bg-white/40 disabled:text-black/50 aspect-square"
            disabled={isSending || (canSend && channel ? !body.trim() : false)}
            size="sm"
            type="submit"
          >
            {isSending ? (
              <span className="text-xs font-semibold">…</span>
            ) : (
              <Send className="h-4 w-4" aria-hidden />
            )}
          </Button>
        </form>
      </aside>
    )
  }

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/6 text-white shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div className="shrink-0 border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/10">
              <MessageCircle className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-white">Trò chuyện</h2>
              <p className="text-xs text-white/60">
                {comments.length} bình luận{isLive ? '' : ' · chỉ gửi khi đang live'}
              </p>
            </div>
          </div>
          {!user && !loading ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80 ring-1 ring-white/10">
              <Lock className="h-3.5 w-3.5" aria-hidden />
              Cần đăng nhập
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div
          className={cn(
            'mb-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]',
            'max-h-[calc(100svh-18rem)]',
          )}
        >
          {commentListContent}
        </div>

        {createError ? <p className="mb-2 text-xs text-rose-300">{createError}</p> : null}
        {queryError ? <p className="mb-2 text-xs text-rose-300">{queryError}</p> : null}

        <form className="shrink-0 space-y-3" onSubmit={handleSubmit}>
          <Textarea
            aria-label="Nhập bình luận livestream"
            className="min-h-[80px] resize-none border-white/10 bg-white/7 text-sm text-white placeholder:text-white/45"
            placeholder={placeholder}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onClick={() => {
              if (!loading && !user) openAuthModal()
            }}
            readOnly={!user || !isLive}
          />
          <Button
            className="w-full bg-white text-black hover:bg-white/90"
            disabled={isSending || !body.trim() || !canSend || !channel}
            size="sm"
            type="submit"
          >
            {!user ? 'Đăng nhập để chat' : isSending ? 'Đang gửi…' : 'Gửi'}
          </Button>
        </form>
      </div>
    </aside>
  )
}

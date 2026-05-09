'use client'

import { Heart, Lock, MessageCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  StreamChat,
  type Channel,
  type Event,
  type LocalMessage,
  type UserResponse,
} from 'stream-chat'

import { Button } from '@/components/ui/button'
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
}

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

export function LiveViewerEngagement({
  slug,
  isLive,
  isGuest = false,
  overlay = false,
}: {
  slug: string
  isLive: boolean
  isGuest?: boolean
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
    if (!slug || loading || !user || isGuest) return

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
  }, [isGuest, loading, slug, user])

  useEffect(() => {
    return () => {
      if (chatClient) {
        void chatClient.disconnectUser().catch(() => null)
      }
    }
  }, [chatClient])

  const reversedDocs = useMemo(() => [...comments].reverse(), [comments])
  const canSend = Boolean(user) && !isGuest && isLive

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

  const toggleLike = async (comment: LivestreamComment) => {
    if (!channel || isGuest) return
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

  return (
    <aside
      className={cn(
        'overflow-hidden rounded-[1.75rem] border shadow-2xl backdrop-blur-xl',
        overlay
          ? 'border-white/10 bg-black/45 text-white shadow-black/30'
          : 'border-white/10 bg-white/6 text-white shadow-black/20',
      )}
    >
      <div className={cn('border-b px-4 py-3', overlay ? 'border-white/10' : 'border-white/10')}>
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
          {isGuest ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80 ring-1 ring-white/10">
              <Lock className="h-3.5 w-3.5" aria-hidden />
              Guest lock
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 p-4">
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            if (!user) {
              openAuthModal()
              return
            }
            if (isGuest) return
            const nextBody = body.trim()
            if (!nextBody || !isLive) return
            void sendMessage(nextBody)
          }}
        >
          <Textarea
            aria-label="Nhập bình luận livestream"
            className="min-h-[80px] resize-none border-white/10 bg-white/7 text-sm text-white placeholder:text-white/45"
            placeholder={
              loading
                ? 'Đang tải...'
                : isGuest
                  ? 'Đăng nhập để bình luận'
                  : user
                    ? isLive
                      ? 'Viết bình luận...'
                      : 'Chỉ gửi bình luận khi livestream đang phát'
                    : 'Đăng nhập để bình luận'
            }
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onClick={() => {
              if (!loading && (!user || isGuest)) openAuthModal()
            }}
            readOnly={!user || !isLive || isGuest}
          />
          <Button
            className="w-full bg-white text-black hover:bg-white/90"
            disabled={isSending || !body.trim() || !canSend || !channel}
            size="sm"
            type="submit"
          >
            {isGuest ? 'Đăng nhập để chat' : isSending ? 'Đang gửi…' : 'Gửi'}
          </Button>
        </form>

        {createError ? <p className="text-xs text-rose-300">{createError}</p> : null}
        {queryError ? <p className="text-xs text-rose-300">{queryError}</p> : null}

        <div
          className={cn(
            'space-y-2 overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]',
            overlay ? 'max-h-[38svh]' : 'max-h-[calc(100svh-18rem)]',
          )}
        >
          {isLoadingComments ? (
            <p className="py-6 text-center text-xs text-white/55">Đang tải bình luận…</p>
          ) : reversedDocs.length === 0 ? (
            <p className="py-6 text-center text-xs text-white/55">Chưa có bình luận.</p>
          ) : (
            reversedDocs.map((comment) => {
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
                        !isGuest && 'hover:bg-rose-500/10 hover:text-rose-300',
                        comment.likedByMe && !isGuest && 'text-rose-300',
                      )}
                      disabled={isTogglingLike || !channel || isGuest}
                      type="button"
                      onClick={() => {
                        if (!user || isGuest) {
                          openAuthModal()
                          return
                        }
                        void toggleLike(comment)
                      }}
                    >
                      <Heart
                        className={cn('h-4 w-4', comment.likedByMe && !isGuest && 'fill-current')}
                      />
                      <span className="tabular-nums text-[11px] font-medium">
                        {comment.likeCount}
                      </span>
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

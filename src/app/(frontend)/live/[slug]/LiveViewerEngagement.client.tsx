'use client'

import { useEffect, useMemo, useState } from 'react'
import { Heart, MessageCircle } from 'lucide-react'
import { StreamChat, type Channel, type Event, type LocalMessage, type UserResponse } from 'stream-chat'

import { useAuth } from '@/providers/Auth'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
}: {
  slug: string
  isLive: boolean
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
    if (!slug || loading || !user) return

    let active = true
    let activeChannel: Channel | null = null
    let unsubscribe: (() => void) | null = null

    const setup = async () => {
      setIsLoadingComments(true)
      setQueryError(null)
      try {
        const tokenRes = await fetch('/api/stream/chat-token', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug }),
        })
        if (tokenRes.status === 401) {
          openAuthModal()
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
        setQueryError(error instanceof Error ? error.message : 'Không tải được bình luận livestream')
      } finally {
        if (active) setIsLoadingComments(false)
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
  }, [loading, openAuthModal, slug, user])

  useEffect(() => {
    return () => {
      if (chatClient) {
        void chatClient.disconnectUser().catch(() => null)
      }
    }
  }, [chatClient])

  const reversedDocs = useMemo(() => [...comments].reverse(), [comments])

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
    if (!channel) return
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
                {comments.length} bình luận{isLive ? '' : ' · chỉ gửi khi đang live'}
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
            void sendMessage(nextBody)
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
            disabled={isSending || !body.trim() || !canSend || !channel}
            size="sm"
            type="submit"
          >
            {isSending ? 'Đang gửi…' : 'Gửi'}
          </Button>
        </form>

        {createError ? <p className="text-xs text-destructive">{createError}</p> : null}

        {queryError ? <p className="text-xs text-destructive">{queryError}</p> : null}

        <div className="max-h-[min(22rem,55vh)] space-y-2 overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]">
          {isLoadingComments ? (
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
                      disabled={isTogglingLike || !channel}
                      type="button"
                      onClick={() => {
                        if (!user) {
                          openAuthModal()
                          return
                        }
                        void toggleLike(comment)
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

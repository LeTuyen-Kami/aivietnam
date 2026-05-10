'use client'

import {
  CallingState,
  LivestreamLayout,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  useCallStateHooks,
  type Call,
} from '@stream-io/video-react-sdk'
import '@stream-io/video-react-sdk/dist/css/styles.css'
import { AlertCircle, Clock3, Radio, Sparkles, User } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { getPublicStreamSetupMessage } from '@/lib/stream/publicClientEnv'
import type { Livestream } from '@/payload-types'
import { cn } from '@/utilities/ui'

import { LiveViewerEngagement } from './LiveViewerEngagement.client'

type ViewerClientProps = {
  livestream: Livestream
  streamApiKey: string
  streamSetupMessage: string | null
  streamUser: {
    id: string
    name: string
    email: string | null
  }
}

type ViewerStatus = {
  status: Livestream['status']
  callId: string | null
  callType: string | null
}

type ViewerStatusResponse = {
  status?: Livestream['status']
  callId?: string | null
  callType?: string | null
  error?: string
}

function isLiveStatus(status: Livestream['status']): boolean {
  return status === 'live'
}

function statusLabel(status: Livestream['status']): string {
  switch (status) {
    case 'live':
      return 'Đang phát'
    case 'scheduled':
      return 'Sắp phát'
    case 'draft':
      return 'Chuẩn bị'
    case 'ended':
      return 'Đã kết thúc'
    default:
      return status
  }
}

function statusPillClass(status: Livestream['status']): string {
  switch (status) {
    case 'live':
      return 'bg-rose-500/85 text-white ring-rose-300/30'
    case 'scheduled':
    case 'draft':
      return 'bg-amber-500/85 text-white ring-amber-300/30'
    case 'ended':
      return 'bg-black/55 text-white ring-white/10'
    default:
      return 'bg-black/55 text-white ring-white/10'
  }
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function LiveCallContent() {
  const { useCallCallingState } = useCallStateHooks()
  const callingState = useCallCallingState()
  const [hasUserEnabledAudio, setHasUserEnabledAudio] = useState(false)

  const showReconnecting =
    callingState === CallingState.RECONNECTING || callingState === CallingState.MIGRATING

  return (
    <div className="h-full w-full">
      {showReconnecting ? (
        <div className="absolute left-3 right-3 top-16 z-20 flex items-center gap-2 rounded-full bg-amber-500/85 px-3 py-2 text-xs font-medium text-white shadow-lg backdrop-blur sm:left-6 sm:right-auto">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          Đang kết nối lại livestream…
        </div>
      ) : null}

      {!hasUserEnabledAudio ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 px-6">
          <button
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black shadow-lg transition hover:bg-white/90"
            onClick={() => {
              setHasUserEnabledAudio(true)
            }}
            type="button"
          >
            Bật tiếng livestream
          </button>
        </div>
      ) : null}

      <LivestreamLayout
        key={hasUserEnabledAudio ? 'audio-on' : 'audio-off'}
        muted={!hasUserEnabledAudio}
        showMuteButton
        showDuration
        showLiveBadge
        showParticipantCount
        showSpeakerName
      />
    </div>
  )
}

function ViewerStatePanel({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex h-full min-h-[60svh] flex-col items-center justify-center gap-4 px-6 text-center text-white">
      <div className="flex h-18 w-18 items-center justify-center rounded-3xl bg-white/10 backdrop-blur ring-1 ring-white/15">
        {icon}
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        <p className="text-sm text-white/72 sm:text-base">{description}</p>
      </div>
    </div>
  )
}

export function ViewerClient({
  livestream,
  streamApiKey,
  streamSetupMessage,
  streamUser,
}: ViewerClientProps) {
  const [error, setError] = useState<string | null>(null)
  const [statusState, setStatusState] = useState<ViewerStatus>({
    status: livestream.status,
    callId: livestream.callId,
    callType: livestream.callType,
  })
  const [client, setClient] = useState<StreamVideoClient | null>(null)
  const [call, setCall] = useState<Call | null>(null)

  const apiKey = streamApiKey.trim()
  const hasStreamingConfig = useMemo(() => apiKey.length > 0, [apiKey])
  const isGuest = !streamUser.email
  const live = isLiveStatus(statusState.status)
  const waitingForLive = statusState.status === 'scheduled' || statusState.status === 'draft'
  const scheduledAt = formatDate(livestream.scheduledAt)
  const safeSlug = livestream.slug ?? ''

  const tokenProvider = useCallback(async () => {
    const response = await fetch('/api/stream/token', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        guestId: streamUser.id,
        guestName: streamUser.name,
      }),
    })

    const body = (await response.json().catch(() => ({}))) as { token?: string; error?: string }
    if (!response.ok || !body.token) {
      throw new Error(body.error ?? 'Không thể kết nối livestream. Vui lòng thử lại.')
    }

    return body.token
  }, [streamUser.id, streamUser.name])

  const pollStatus = useCallback(async () => {
    if (!safeSlug) return

    const response = await fetch(`/api/livestreams/${encodeURIComponent(safeSlug)}/status`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    })

    const body = (await response.json().catch(() => ({}))) as ViewerStatusResponse
    if (!response.ok || !body.status) return

    setStatusState({
      status: body.status,
      callId: body.callId ?? null,
      callType: body.callType ?? null,
    })
  }, [safeSlug])

  useEffect(() => {
    void pollStatus()
    const interval = window.setInterval(() => {
      void pollStatus()
    }, 10000)

    return () => {
      window.clearInterval(interval)
    }
  }, [pollStatus])

  useEffect(() => {
    if (!hasStreamingConfig || !live) return
    if (!statusState.callId || !statusState.callType) return

    const liveCallId = statusState.callId
    const liveCallType = statusState.callType

    let mounted = true
    let activeCall: Call | null = null
    let activeClient: StreamVideoClient | null = null

    const connect = async () => {
      try {
        setError(null)
        const nextClient = new StreamVideoClient({
          apiKey,
          user: {
            ...streamUser,
            type: 'authenticated',
          },
          tokenProvider,
        })
        const nextCall = nextClient.call(liveCallType, liveCallId)
        await nextCall.join({ create: false })

        if (!mounted) {
          await nextCall.leave().catch(() => null)
          await nextClient.disconnectUser().catch(() => null)
          return
        }

        activeClient = nextClient
        activeCall = nextCall
        setClient(nextClient)
        setCall(nextCall)
      } catch (_setupError) {
        setError('Không thể kết nối livestream. Vui lòng kiểm tra mạng rồi thử lại.')
      }
    }

    void connect()

    return () => {
      mounted = false
      setCall(null)
      setClient(null)
      if (activeCall) {
        void activeCall.leave().catch(() => null)
      }
      if (activeClient) {
        void activeClient.disconnectUser().catch(() => null)
      }
    }
  }, [
    apiKey,
    hasStreamingConfig,
    live,
    statusState.callId,
    statusState.callType,
    streamUser,
    tokenProvider,
  ])

  return (
    <section className="relative h-[100svh] w-full overflow-hidden bg-black text-white z-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_30%),linear-gradient(180deg,_rgba(0,0,0,0.18)_0%,_rgba(0,0,0,0.78)_100%)]" />

      <div className="relative grid h-[100svh] w-full lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="relative flex h-[100svh] min-h-0 flex-col overflow-hidden">
          <div className="absolute left-3 right-3 top-3 z-20 flex items-start justify-between gap-3 sm:left-6 sm:right-6 sm:top-6">
            <div className="max-w-[85%] space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset backdrop-blur',
                    statusPillClass(statusState.status),
                  )}
                >
                  {live ? (
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                    </span>
                  ) : null}
                  {statusLabel(statusState.status)}
                </span>
                {scheduledAt ? (
                  <span className="rounded-full bg-black/40 px-3 py-1 text-[11px] text-white/75 ring-1 ring-white/10 backdrop-blur">
                    {scheduledAt}
                  </span>
                ) : null}
              </div>

              <div className="space-y-1">
                <h1 className="line-clamp-2 text-xl font-semibold tracking-tight sm:text-3xl">
                  {livestream.title}
                </h1>
                {livestream.description ? (
                  <p className="line-clamp-3 max-w-2xl text-sm text-white/70 sm:text-base">
                    {livestream.description}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="relative flex-1">
            {hasStreamingConfig && client && call && live ? (
              <div className="h-full w-full bg-black">
                <StreamVideo client={client}>
                  <StreamCall call={call}>
                    <LiveCallContent />
                  </StreamCall>
                </StreamVideo>
              </div>
            ) : !hasStreamingConfig ? (
              <ViewerStatePanel
                description={streamSetupMessage ?? getPublicStreamSetupMessage()}
                icon={<AlertCircle className="h-9 w-9" aria-hidden />}
                title="Chưa cấu hình livestream"
              />
            ) : error ? (
              <ViewerStatePanel
                description={error}
                icon={<AlertCircle className="h-9 w-9" aria-hidden />}
                title="Không thể kết nối livestream"
              />
            ) : waitingForLive ? (
              <ViewerStatePanel
                description="Giữ màn hình mở. Khi host bắt đầu phát, video sẽ xuất hiện tại đây."
                icon={<Clock3 className="h-9 w-9" aria-hidden />}
                title="Livestream chưa bắt đầu"
              />
            ) : statusState.status === 'ended' ? (
              <ViewerStatePanel
                description="Cảm ơn bạn đã theo dõi. Phiên phát đã kết thúc."
                icon={<Radio className="h-9 w-9" aria-hidden />}
                title="Livestream đã kết thúc"
              />
            ) : (
              <ViewerStatePanel
                description="Phiên đang được chuẩn bị. Hệ thống sẽ tự cập nhật khi bắt đầu phát."
                icon={<Sparkles className="h-9 w-9" aria-hidden />}
                title="Đang chờ phát sóng"
              />
            )}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-linear-to-t from-black/90 via-black/45 to-transparent px-3 pb-4 pt-24 sm:px-6 lg:hidden">
            <div className="pointer-events-auto ml-auto max-w-[min(100%,28rem)]">
              <LiveViewerEngagement isGuest={isGuest} isLive={live} overlay slug={safeSlug} />
            </div>
          </div>
        </div>

        <aside className="hidden border-l border-white/10 bg-black/65 backdrop-blur-xl lg:block">
          <div className="flex h-full flex-col">
            <div className="border-b border-white/10 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 ring-1 ring-white/10">
                  <User className="h-5 w-5 text-white/90" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{streamUser.name}</p>
                  <p className="text-xs text-white/60">
                    {isGuest ? 'Khách xem · chat bị khóa' : 'Đang xem livestream'}
                  </p>
                </div>
              </div>
            </div>
            <div className="min-h-0 flex-1 p-4">
              <LiveViewerEngagement isGuest={isGuest} isLive={live} slug={safeSlug} />
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CallingState,
  LivestreamLayout,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  type Call,
  useCallStateHooks,
} from '@stream-io/video-react-sdk'
import '@stream-io/video-react-sdk/dist/css/styles.css'
import { AlertCircle, Clock, Radio, Sparkles, User } from 'lucide-react'

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

function viewerReturnTo(slug: string): string {
  const encodedSlug = encodeURIComponent(slug)
  return `/live/${encodedSlug}`
}

function loginRequiredUrl(returnTo: string): string {
  return `/?auth=login_required&returnTo=${encodeURIComponent(returnTo)}`
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
      return 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/30 dark:text-emerald-300'
    case 'scheduled':
    case 'draft':
      return 'bg-amber-500/12 text-amber-950 ring-amber-500/25 dark:text-amber-100'
    case 'ended':
      return 'bg-muted text-muted-foreground ring-border'
    default:
      return 'bg-muted text-muted-foreground ring-border'
  }
}

function LiveCallContent() {
  const { useCallCallingState } = useCallStateHooks()
  const callingState = useCallCallingState()

  const showReconnecting =
    callingState === CallingState.RECONNECTING || callingState === CallingState.MIGRATING

  return (
    <div className="space-y-3">
      {showReconnecting ? (
        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
          </span>
          Đang kết nối lại livestream…
        </div>
      ) : null}
      <LivestreamLayout />
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

  const slug = livestream.slug ?? ''
  const defaultReturnTo = useMemo(() => viewerReturnTo(slug), [slug])
  const currentReturnTo = useCallback(() => {
    if (typeof window === 'undefined') return defaultReturnTo
    const path = `${window.location.pathname}${window.location.search}${window.location.hash}`
    return path || defaultReturnTo
  }, [defaultReturnTo])

  const redirectToLoginRequired = useCallback(() => {
    if (typeof window === 'undefined') return
    window.location.assign(loginRequiredUrl(currentReturnTo()))
  }, [currentReturnTo])

  const tokenProvider = useCallback(async () => {
    const response = await fetch('/api/stream/token', {
      method: 'POST',
      credentials: 'include',
    })

    if (response.status === 401) {
      redirectToLoginRequired()
      throw new Error('Unauthorized')
    }

    const body = (await response.json().catch(() => ({}))) as { token?: string; error?: string }
    if (!response.ok || !body.token) {
      throw new Error(body.error ?? 'Không thể kết nối livestream. Vui lòng thử lại.')
    }

    return body.token
  }, [redirectToLoginRequired])

  const pollStatus = useCallback(async () => {
    if (!slug) return

    const response = await fetch(`/api/livestreams/${encodeURIComponent(slug)}/status`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    })

    if (response.status === 401) {
      redirectToLoginRequired()
      return
    }

    const body = (await response.json().catch(() => ({}))) as ViewerStatusResponse
    if (!response.ok || !body.status) return

    setStatusState({
      status: body.status,
      callId: body.callId ?? null,
      callType: body.callType ?? null,
    })
  }, [redirectToLoginRequired, slug])

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
    if (!hasStreamingConfig || !isLiveStatus(statusState.status)) return
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
        setError('Không thể kết nối livestream. Vui lòng kiểm tra đăng nhập và kết nối mạng, sau đó thử lại.')
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
  }, [apiKey, hasStreamingConfig, statusState.callId, statusState.callType, statusState.status, streamUser, tokenProvider])

  const waitingForLive = statusState.status === 'scheduled' || statusState.status === 'draft'
  const safeSlug = livestream.slug ?? ''
  const live = isLiveStatus(statusState.status)

  return (
    <section
      className={cn(
        'relative mx-auto max-w-6xl rounded-2xl border border-border/80 bg-card shadow-xl shadow-black/5',
        'ring-1 ring-black/5 dark:ring-white/10',
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-primary/5 via-transparent to-transparent"
        aria-hidden
      />
      <div className="relative p-6 sm:p-8">
        <div className="grid gap-8 xl:grid-cols-12 xl:gap-10">
          <div className="min-w-0 space-y-6 xl:col-span-8">
            <header className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                    statusPillClass(statusState.status),
                  )}
                >
                  {live ? (
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                  ) : null}
                  {statusLabel(statusState.status)}
                </span>
              </div>
              <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                {livestream.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                <span>Đang xem với tài khoản {streamUser.name}</span>
              </div>
            </header>

            {!hasStreamingConfig ? (
              <div
                className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
                role="alert"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                <p>{streamSetupMessage ?? getPublicStreamSetupMessage()}</p>
              </div>
            ) : null}

            {error ? (
              <div
                className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
                role="alert"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                <p>{error}</p>
              </div>
            ) : null}

            <div
              className={cn(
                'overflow-hidden rounded-xl border border-border/80 bg-linear-to-b from-muted/30 to-muted/5',
                'shadow-inner',
              )}
            >
              {hasStreamingConfig && client && call && live ? (
                <div className="aspect-video bg-black">
                  <StreamVideo client={client}>
                    <StreamCall call={call}>
                      <LiveCallContent />
                    </StreamCall>
                  </StreamVideo>
                </div>
              ) : waitingForLive ? (
                <div className="flex aspect-video flex-col items-center justify-center gap-4 px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground ring-1 ring-border">
                    <Clock className="h-8 w-8" aria-hidden />
                  </div>
                  <div className="max-w-md space-y-2">
                    <h2 className="text-lg font-semibold tracking-tight">Livestream chưa bắt đầu</h2>
                    <p className="text-pretty text-sm text-muted-foreground">
                      Giữ trang mở — trạng thái được cập nhật định kỳ. Khi host bắt đầu phát, video sẽ
                      xuất hiện tại đây.
                    </p>
                  </div>
                </div>
              ) : statusState.status === 'ended' ? (
                <div className="flex aspect-video flex-col items-center justify-center gap-4 px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground ring-1 ring-border">
                    <Radio className="h-8 w-8" aria-hidden />
                  </div>
                  <div className="max-w-md space-y-2">
                    <h2 className="text-lg font-semibold tracking-tight">Livestream đã kết thúc</h2>
                    <p className="text-pretty text-sm text-muted-foreground">
                      Cảm ơn bạn đã theo dõi. Bạn có thể quay lại trang chủ để xem nội dung khác.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex aspect-video flex-col items-center justify-center gap-4 px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                    <Sparkles className="h-8 w-8" aria-hidden />
                  </div>
                  <div className="max-w-md space-y-2">
                    <h2 className="text-lg font-semibold tracking-tight">Đang chờ phát sóng</h2>
                    <p className="text-pretty text-sm text-muted-foreground">
                      Phiên đang được chuẩn bị. Hệ thống sẽ tự tải khi livestream bắt đầu.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 xl:col-span-4">
            <div className="xl:sticky xl:top-24">
              <LiveViewerEngagement isLive={live} slug={safeSlug} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

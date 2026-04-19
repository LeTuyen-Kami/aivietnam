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

import { getPublicStreamSetupMessage } from '@/lib/stream/publicClientEnv'
import type { Livestream } from '@/payload-types'

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

function LiveCallContent() {
  const { useCallCallingState } = useCallStateHooks()
  const callingState = useCallCallingState()

  const showReconnecting =
    callingState === CallingState.RECONNECTING || callingState === CallingState.MIGRATING

  return (
    <div className="space-y-3">
      {showReconnecting ? (
        <p className="text-sm text-muted-foreground">Đang kết nối lại livestream...</p>
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

  return (
    <section className="mx-auto max-w-3xl rounded-lg border border-border bg-card p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{livestream.title}</h1>
        <p className="text-sm text-muted-foreground">Signed in as {streamUser.name}</p>
      </header>

      {!hasStreamingConfig ? (
        <p className="mt-4 text-sm text-destructive">
          {streamSetupMessage ?? getPublicStreamSetupMessage()}
        </p>
      ) : null}

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      {hasStreamingConfig && client && call && isLiveStatus(statusState.status) ? (
        <div className="mt-6 overflow-hidden rounded border border-border">
          <StreamVideo client={client}>
            <StreamCall call={call}>
              <LiveCallContent />
            </StreamCall>
          </StreamVideo>
        </div>
      ) : waitingForLive ? (
        <div className="mt-6 rounded border border-dashed border-border bg-secondary/30 p-6">
          <h2 className="text-xl font-semibold">Livestream chưa bắt đầu</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Phiên này đã được tạo nhưng chưa phát trực tiếp. Vui lòng giữ trang mở, hệ thống sẽ tự
            cập nhật khi livestream bắt đầu.
          </p>
        </div>
      ) : statusState.status === 'ended' ? (
        <div className="mt-6 rounded border border-dashed border-border bg-secondary/30 p-6">
          <h2 className="text-xl font-semibold">Livestream đã kết thúc</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Phiên phát đã kết thúc. Bạn có thể quay lại trang chủ để xem các nội dung khác.
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded border border-dashed border-border bg-secondary/30 p-6">
          <h2 className="text-xl font-semibold">Livestream chưa bắt đầu</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Phiên livestream đang được chuẩn bị. Hệ thống sẽ tự cập nhật khi phiên phát trực tiếp
            bắt đầu.
          </p>
        </div>
      )}
    </section>
  )
}

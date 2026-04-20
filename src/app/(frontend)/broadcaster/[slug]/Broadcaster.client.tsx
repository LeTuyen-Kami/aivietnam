'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  LivestreamLayout,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  type Call,
} from '@stream-io/video-react-sdk'
import '@stream-io/video-react-sdk/dist/css/styles.css'
import { AlertCircle, Radio, Square, Video } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { LiveViewerEngagement } from '@/app/(frontend)/live/[slug]/LiveViewerEngagement.client'
import { getPublicStreamSetupMessage } from '@/lib/stream/publicClientEnv'
import type { Livestream } from '@/payload-types'
import { cn } from '@/utilities/ui'

type BroadcasterClientProps = {
  livestream: Pick<Livestream, 'id' | 'slug' | 'title' | 'callId' | 'callType' | 'status'>
  streamApiKey: string
  streamSetupMessage: string | null
  streamUser: {
    id: string
    name?: string
  }
}

type StartResponse = {
  callId: string
  callType: string
  status: 'live'
}

function isLiveStatus(status: Livestream['status']): boolean {
  return status === 'live'
}

function statusLabel(status: Livestream['status']): string {
  switch (status) {
    case 'live':
      return 'Đang phát'
    case 'scheduled':
      return 'Đã lên lịch'
    case 'draft':
      return 'Bản nháp'
    case 'ended':
      return 'Đã kết thúc'
    default:
      return status
  }
}

function statusStyles(status: Livestream['status']): string {
  switch (status) {
    case 'live':
      return 'bg-emerald-500/15 text-emerald-700 ring-emerald-500/25 dark:text-emerald-400'
    case 'scheduled':
      return 'bg-sky-500/15 text-sky-800 ring-sky-500/25 dark:text-sky-300'
    case 'draft':
      return 'bg-amber-500/15 text-amber-900 ring-amber-500/25 dark:text-amber-200'
    case 'ended':
      return 'bg-muted text-muted-foreground ring-border'
    default:
      return 'bg-muted text-muted-foreground ring-border'
  }
}

export function BroadcasterClient({
  livestream,
  streamApiKey,
  streamSetupMessage,
  streamUser,
}: BroadcasterClientProps) {
  const apiKey = streamApiKey.trim()
  const [error, setError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [callState, setCallState] = useState<{
    callId: string
    callType: string
    status: Livestream['status']
  }>({
    callId: livestream.callId,
    callType: livestream.callType,
    status: livestream.status,
  })
  const [client, setClient] = useState<StreamVideoClient | null>(null)
  const [call, setCall] = useState<Call | null>(null)

  const tokenProvider = useCallback(async () => {
    const response = await fetch('/api/stream/broadcaster-token', {
      method: 'POST',
      credentials: 'include',
    })

    const body = (await response.json().catch(() => ({}))) as { token?: string; error?: string }
    if (!response.ok || !body.token) {
      throw new Error(body.error ?? 'Không lấy được token phát sóng')
    }

    return body.token
  }, [])

  const hasStreamingConfig = useMemo(() => apiKey.trim().length > 0, [apiKey])

  useEffect(() => {
    if (!hasStreamingConfig || !isLiveStatus(callState.status)) return

    let mounted = true
    let activeCall: Call | null = null
    let activeClient: StreamVideoClient | null = null

    const setup = async () => {
      try {
        const nextClient = new StreamVideoClient({
          apiKey,
          user: {
            ...streamUser,
            type: 'authenticated',
          },
          tokenProvider,
        })
        const nextCall = nextClient.call(callState.callType, callState.callId)
        await nextCall.join({ create: false })
        if (typeof nextCall.goLive === 'function') {
          await nextCall.goLive()
        }

        if (!mounted) {
          await nextCall.leave().catch(() => null)
          await nextClient.disconnectUser().catch(() => null)
          return
        }

        activeCall = nextCall
        activeClient = nextClient
        setClient(nextClient)
        setCall(nextCall)
      } catch (setupError) {
        setError(setupError instanceof Error ? setupError.message : 'Không thể tham gia phiên phát')
      }
    }

    void setup()

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
  }, [apiKey, callState.callId, callState.callType, callState.status, hasStreamingConfig, streamUser, tokenProvider])

  const startLivestream = useCallback(async () => {
    setError(null)
    setIsStarting(true)
    try {
      const response = await fetch(`/api/livestreams/${livestream.id}/start`, {
        method: 'POST',
        credentials: 'include',
      })
      const body = (await response.json().catch(() => ({}))) as StartResponse & { error?: string }
      if (!response.ok) {
        throw new Error(body.error ?? 'Không thể bắt đầu livestream')
      }
      setCallState({
        callId: body.callId,
        callType: body.callType,
        status: body.status,
      })
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Không thể bắt đầu livestream')
    } finally {
      setIsStarting(false)
    }
  }, [livestream.id])

  const endLivestream = useCallback(async () => {
    const approved = window.confirm(
      'Kết thúc livestream? Người xem sẽ thấy phiên đã kết thúc và không còn luồng trực tiếp.',
    )
    if (!approved) return

    setError(null)
    setIsEnding(true)
    try {
      const response = await fetch(`/api/livestreams/${livestream.id}/end`, {
        method: 'POST',
        credentials: 'include',
      })
      const body = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) {
        throw new Error(body.error ?? 'Không thể kết thúc livestream')
      }
      if (call) {
        await call.endCall().catch(() => null)
      }
      setCallState((prev) => ({ ...prev, status: 'ended' }))
    } catch (endError) {
      setError(endError instanceof Error ? endError.message : 'Không thể kết thúc livestream')
    } finally {
      setIsEnding(false)
    }
  }, [call, livestream.id])

  const live = isLiveStatus(callState.status)
  const commentSlug = livestream.slug?.trim() ?? ''

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xl shadow-black/5',
        'ring-1 ring-black/5 dark:ring-white/10',
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/6 via-transparent to-transparent"
        aria-hidden
      />
      <div className="relative space-y-6 p-6 sm:p-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                  statusStyles(callState.status),
                )}
              >
                {live ? (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                ) : null}
                {statusLabel(callState.status)}
              </span>
            </div>
            <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              Phát sóng trực tiếp
            </h1>
            <p className="text-pretty text-muted-foreground">{livestream.title}</p>
            {streamUser.name ? (
              <p className="text-xs text-muted-foreground">Tài khoản: {streamUser.name}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
            <Button
              className="gap-2 shadow-sm"
              disabled={!hasStreamingConfig || isStarting || isEnding || live}
              onClick={() => {
                void startLivestream()
              }}
              size="default"
              type="button"
            >
              <Radio className="h-4 w-4" aria-hidden />
              {isStarting ? 'Đang bắt đầu…' : 'Bắt đầu live'}
            </Button>
            <Button
              className="gap-2"
              disabled={!live || isEnding}
              onClick={() => {
                void endLivestream()
              }}
              size="default"
              type="button"
              variant="destructive"
            >
              <Square className="h-4 w-4" aria-hidden />
              {isEnding ? 'Đang kết thúc…' : 'Kết thúc'}
            </Button>
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
            <p>
              Không thể thực hiện thao tác. Kiểm tra quyền admin và kết nối GetStream, rồi thử lại.
              <span className="mt-1 block font-mono text-xs opacity-90">{error}</span>
            </p>
          </div>
        ) : null}

        <div className="grid gap-8 xl:grid-cols-12 xl:gap-10">
          <div className="min-w-0 xl:col-span-8">
            <div
              className={cn(
                'overflow-hidden rounded-xl border border-border/80 bg-linear-to-b from-muted/40 to-muted/10',
                'shadow-inner',
              )}
            >
              {client && call && live ? (
                <div className="aspect-video bg-black">
                  <StreamVideo client={client}>
                    <StreamCall call={call}>
                      <LivestreamLayout />
                    </StreamCall>
                  </StreamVideo>
                </div>
              ) : (
                <div className="flex aspect-video flex-col items-center justify-center gap-4 px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground shadow-sm ring-1 ring-border">
                    <Video className="h-8 w-8" aria-hidden />
                  </div>
                  <div className="max-w-md space-y-1">
                    <p className="text-sm font-medium text-foreground">Sẵn sàng phát sóng</p>
                    <p className="text-pretty text-sm text-muted-foreground">
                      Phiên đã có trong hệ thống nhưng chưa live. Nhấn <strong>Bắt đầu live</strong> để mở
                      camera/mic và phát cho người xem.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 xl:col-span-4">
            <div className="xl:sticky xl:top-24">
              {commentSlug ? (
                <LiveViewerEngagement isLive={live} slug={commentSlug} />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

'use client'

import { NoiseCancellation } from '@stream-io/audio-filters-web'
import {
  LivestreamLayout,
  NoiseCancellationProvider,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  useCallStateHooks,
  useNoiseCancellation,
  type Call,
} from '@stream-io/video-react-sdk'
import '@stream-io/video-react-sdk/dist/css/styles.css'
import {
  AlertCircle,
  Copy,
  ExternalLink,
  Mic,
  MicOff,
  Radio,
  Shield,
  Square,
  Video,
  VideoOff,
  WandSparkles,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { LiveViewerEngagement } from '@/app/(frontend)/live/[slug]/LiveViewerEngagement.client'
import { Button } from '@/components/ui/button'
import { ConfirmModal } from '@/components/ui/confirm'
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
      return 'bg-rose-500/85 text-white ring-rose-300/30'
    case 'scheduled':
      return 'bg-sky-500/85 text-white ring-sky-300/30'
    case 'draft':
      return 'bg-amber-500/85 text-white ring-amber-300/30'
    case 'ended':
      return 'bg-black/50 text-white ring-white/10'
    default:
      return 'bg-black/50 text-white ring-white/10'
  }
}

function BroadcasterStatePanel({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: React.ReactNode
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

function StudioDeviceControls() {
  const { useCameraState, useMicrophoneState } = useCallStateHooks()
  const { camera, isMute: isCameraMute } = useCameraState()
  const { microphone, isMute: isMicrophoneMute } = useMicrophoneState()
  const {
    isEnabled: isNoiseCancellationEnabled,
    isSupported: isNoiseCancellationSupported,
    setEnabled,
  } = useNoiseCancellation()

  return (
    <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center gap-2 sm:bottom-6 sm:left-6 sm:right-6">
      <Button
        className="gap-2 border-white/15 bg-black/55 text-white backdrop-blur"
        onClick={() => {
          void microphone.toggle()
        }}
        size="sm"
        type="button"
        variant="outline"
      >
        {isMicrophoneMute ? (
          <MicOff className="h-4 w-4" aria-hidden />
        ) : (
          <Mic className="h-4 w-4" aria-hidden />
        )}
        {isMicrophoneMute ? 'Bật mic' : 'Tắt mic'}
      </Button>

      <Button
        className="gap-2 border-white/15 bg-black/55 text-white backdrop-blur"
        onClick={() => {
          void camera.toggle()
        }}
        size="sm"
        type="button"
        variant="outline"
      >
        {isCameraMute ? (
          <VideoOff className="h-4 w-4" aria-hidden />
        ) : (
          <Video className="h-4 w-4" aria-hidden />
        )}
        {isCameraMute ? 'Bật camera' : 'Tắt camera'}
      </Button>

      <Button
        className="gap-2 border-white/15 bg-black/55 text-white backdrop-blur disabled:border-white/10 disabled:text-white/45"
        disabled={isNoiseCancellationSupported !== true}
        onClick={() => {
          void setEnabled(!isNoiseCancellationEnabled)
        }}
        size="sm"
        type="button"
        variant="outline"
      >
        <Shield className="h-4 w-4" aria-hidden />
        {isNoiseCancellationSupported !== true
          ? 'Noise cancellation không hỗ trợ'
          : isNoiseCancellationEnabled
            ? 'Tắt noise cancellation'
            : 'Bật noise cancellation'}
      </Button>
    </div>
  )
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
  const [isEndConfirmOpen, setIsEndConfirmOpen] = useState(false)
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
  const noiseCancellation = useMemo(() => new NoiseCancellation(), [])

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

  const hasStreamingConfig = useMemo(() => apiKey.length > 0, [apiKey])
  const live = isLiveStatus(callState.status)
  const commentSlug = livestream.slug?.trim() ?? ''
  const viewerHref = commentSlug ? `/live/${encodeURIComponent(commentSlug)}` : ''
  const broadcasterHref = commentSlug ? `/broadcaster/${encodeURIComponent(commentSlug)}` : ''

  useEffect(() => {
    if (!hasStreamingConfig || !live) return

    let mounted = true
    let activeCall: Call | null = null
    let activeClient: StreamVideoClient | null = null

    const setup = async () => {
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
        const nextCall = nextClient.call(callState.callType, callState.callId)
        await nextCall.microphone.enable()
        await nextCall.camera.enable()
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
  }, [
    apiKey,
    callState.callId,
    callState.callType,
    hasStreamingConfig,
    live,
    streamUser,
    tokenProvider,
  ])

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

      setCallState((prev) => ({ ...prev, status: 'ended' }))

      if (call) {
        void call.endCall().catch(() => null)
      }
    } catch (endError) {
      setError(endError instanceof Error ? endError.message : 'Không thể kết thúc livestream')
    } finally {
      setIsEnding(false)
    }
  }, [call, livestream.id])

  useEffect(() => {
    const shouldWarnBeforeUnload = live || isStarting || isEnding
    if (!shouldWarnBeforeUnload) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isEnding, isStarting, live])

  const copyViewerLink = async () => {
    if (!viewerHref || typeof window === 'undefined' || !navigator.clipboard) return
    const absoluteHref = new URL(viewerHref, window.location.origin).toString()
    await navigator.clipboard.writeText(absoluteHref)
  }

  return (
    <section className="relative h-[100svh] w-full overflow-hidden bg-black text-white z-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_30%),linear-gradient(180deg,_rgba(0,0,0,0.18)_0%,_rgba(0,0,0,0.82)_100%)]" />

      <div className="relative grid h-[100svh] w-full lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="relative flex h-[100svh] min-h-0 flex-col overflow-hidden">
          <div className="absolute left-3 right-3 top-3 z-20 flex items-start justify-between gap-3 sm:left-6 sm:right-6 sm:top-6">
            <div className="max-w-[72%] space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset backdrop-blur',
                    statusStyles(callState.status),
                  )}
                >
                  {live ? (
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                    </span>
                  ) : null}
                  {statusLabel(callState.status)}
                </span>
                <span className="rounded-full bg-black/45 px-3 py-1 text-[11px] text-white/75 ring-1 ring-white/10 backdrop-blur">
                  Studio admin
                </span>
              </div>

              <div className="space-y-1">
                <h1 className="line-clamp-2 text-xl font-semibold tracking-tight sm:text-3xl">
                  {livestream.title}
                </h1>
                <p className="text-sm text-white/65 sm:text-base">
                  Điều khiển phiên phát, theo dõi preview và chat realtime trong cùng màn hình.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
                {viewerHref ? (
                  <button
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/10 backdrop-blur transition-colors hover:bg-white/16"
                    onClick={() => {
                      void copyViewerLink()
                    }}
                    type="button"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                    Copy viewer link
                  </button>
                ) : null}
                {viewerHref ? (
                  <a
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/10 backdrop-blur transition-colors hover:bg-white/16"
                    href={viewerHref}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    Mở viewer
                  </a>
                ) : null}
                {broadcasterHref ? (
                  <a
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/10 backdrop-blur transition-colors hover:bg-white/16"
                    href={broadcasterHref}
                  >
                    <Video className="h-3.5 w-3.5" aria-hidden />
                    Route broadcaster
                  </a>
                ) : null}
              </div>
            </div>

            <div className="flex max-w-[46%] shrink-0 flex-col items-end gap-2 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-end">
              <Button
                className="gap-2 bg-white text-black hover:bg-white/90"
                disabled={!hasStreamingConfig || isStarting || isEnding || live}
                onClick={() => {
                  void startLivestream()
                }}
                size="sm"
                type="button"
              >
                <Radio className="h-4 w-4" aria-hidden />
                {isStarting ? 'Đang bắt đầu…' : 'Bắt đầu live'}
              </Button>
              <Button
                className="gap-2 text-white"
                disabled={!live || isEnding}
                onClick={() => {
                  setIsEndConfirmOpen(true)
                }}
                size="sm"
                type="button"
                variant="destructive"
              >
                <Square className="h-4 w-4" aria-hidden />
                {isEnding ? 'Đang kết thúc…' : 'Kết thúc'}
              </Button>
            </div>
          </div>

          <div className="relative flex-1">
            {hasStreamingConfig && client && call && live ? (
              <div className="h-full w-full bg-black">
                <StreamVideo client={client}>
                  <StreamCall call={call}>
                    <NoiseCancellationProvider noiseCancellation={noiseCancellation}>
                      <LivestreamLayout />
                      <StudioDeviceControls />
                    </NoiseCancellationProvider>
                  </StreamCall>
                </StreamVideo>
              </div>
            ) : !hasStreamingConfig ? (
              <BroadcasterStatePanel
                description={streamSetupMessage ?? getPublicStreamSetupMessage()}
                icon={<AlertCircle className="h-9 w-9" aria-hidden />}
                title="Chưa cấu hình livestream"
              />
            ) : error ? (
              <BroadcasterStatePanel
                description={error}
                icon={<AlertCircle className="h-9 w-9" aria-hidden />}
                title="Không thể mở studio phát sóng"
              />
            ) : (
              <BroadcasterStatePanel
                description="Phiên đã có trong hệ thống. Khi sẵn sàng, nhấn Bắt đầu live để phát cho người xem."
                icon={<WandSparkles className="h-9 w-9" aria-hidden />}
                title="Studio sẵn sàng phát"
              />
            )}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-linear-to-t from-black/90 via-black/45 to-transparent px-3 pb-4 pt-24 sm:px-6 lg:hidden">
            <div className="pointer-events-auto ml-auto max-w-[min(100%,28rem)]">
              {commentSlug ? <LiveViewerEngagement isLive={live} slug={commentSlug} /> : null}
            </div>
          </div>
        </div>

        <aside className="hidden border-l border-white/10 bg-black/65 backdrop-blur-xl lg:block">
          <div className="flex h-full flex-col">
            <div className="border-b border-white/10 px-6 py-5">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 ring-1 ring-white/10">
                    <Video className="h-5 w-5 text-white/90" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{streamUser.name || 'Admin'}</p>
                    <p className="text-xs text-white/60">Bảng điều khiển phát sóng</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
                  Người xem mobile sẽ thấy giao diện full screen kiểu live feed. Khung này giúp bạn
                  theo dõi chat song song khi phát.
                </div>
              </div>
            </div>
            <div className="min-h-0 flex-1 p-4">
              {commentSlug ? <LiveViewerEngagement isLive={live} slug={commentSlug} /> : null}
            </div>
          </div>
        </aside>
      </div>

      <ConfirmModal
        open={isEndConfirmOpen}
        onOpenChange={setIsEndConfirmOpen}
        title="Kết thúc livestream?"
        description="Người xem sẽ thấy phiên đã kết thúc và không còn luồng trực tiếp."
        confirmLabel="Kết thúc"
        confirmVariant="destructive"
        pending={isEnding}
        onConfirm={async () => {
          await endLivestream()
          setIsEndConfirmOpen(false)
        }}
      />
    </section>
  )
}

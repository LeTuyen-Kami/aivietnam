'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  LivestreamLayout,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  type Call,
  type User,
} from '@stream-io/video-react-sdk'
import '@stream-io/video-react-sdk/dist/css/styles.css'

import type { Livestream } from '@/payload-types'

type BroadcasterClientProps = {
  livestream: Pick<Livestream, 'id' | 'title' | 'callId' | 'callType' | 'status'>
  streamUser: User
}

type StartResponse = {
  callId: string
  callType: string
  status: 'live'
}

function isLiveStatus(status: Livestream['status']): boolean {
  return status === 'live'
}

export function BroadcasterClient({ livestream, streamUser }: BroadcasterClientProps) {
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY ?? ''
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
      throw new Error(body.error ?? 'Unable to fetch broadcaster token')
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
        const nextClient = new StreamVideoClient({ apiKey, user: streamUser, tokenProvider })
        const nextCall = nextClient.call(callState.callType, callState.callId)
        await nextCall.join({ create: false })

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
        setError(setupError instanceof Error ? setupError.message : 'Unable to join livestream')
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
        throw new Error(body.error ?? 'Unable to start livestream')
      }
      setCallState({
        callId: body.callId,
        callType: body.callType,
        status: body.status,
      })
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Unable to start livestream')
    } finally {
      setIsStarting(false)
    }
  }, [livestream.id])

  const endLivestream = useCallback(async () => {
    const approved = window.confirm(
      'Are you sure you want to end this livestream? This marks the session as ended for viewers.',
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
        throw new Error(body.error ?? 'Unable to end livestream')
      }
      if (call) {
        await call.endCall().catch(() => null)
      }
      setCallState((prev) => ({ ...prev, status: 'ended' }))
    } catch (endError) {
      setError(endError instanceof Error ? endError.message : 'Unable to end livestream')
    } finally {
      setIsEnding(false)
    }
  }, [call, livestream.id])

  return (
    <section className="space-y-6 rounded-lg border border-border bg-card p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Broadcaster</h1>
        <p className="text-muted-foreground">{livestream.title}</p>
      </header>

      {!hasStreamingConfig ? (
        <p className="text-sm text-destructive">
          NEXT_PUBLIC_STREAM_API_KEY is required to run broadcaster UI.
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive">
          Access denied or unable to start livestream. Check your admin access and stream
          connection, then try again.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-60"
          disabled={!hasStreamingConfig || isStarting || isEnding || isLiveStatus(callState.status)}
          onClick={() => {
            void startLivestream()
          }}
        >
          {isStarting ? 'Starting...' : 'Start livestream'}
        </button>
        <button
          type="button"
          className="rounded bg-destructive px-4 py-2 text-destructive-foreground disabled:opacity-60"
          disabled={!isLiveStatus(callState.status) || isEnding}
          onClick={() => {
            void endLivestream()
          }}
        >
          {isEnding ? 'Ending...' : 'End livestream'}
        </button>
      </div>

      {client && call && isLiveStatus(callState.status) ? (
        <div className="overflow-hidden rounded border border-border">
          <StreamVideo client={client}>
            <StreamCall call={call}>
              <LivestreamLayout />
            </StreamCall>
          </StreamVideo>
        </div>
      ) : (
        <div className="rounded border border-dashed border-border p-6 text-sm text-muted-foreground">
          Livestream is ready to start. This session exists in Payload but is not live yet. Start
          the livestream to begin broadcasting.
        </div>
      )}
    </section>
  )
}

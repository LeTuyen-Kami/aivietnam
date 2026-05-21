'use client'

import { humanize } from '@stream-io/video-client'
import { useCallStateHooks } from '@stream-io/video-react-sdk'
import { useEffect, useMemo, useState } from 'react'

function formatLiveDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (value: number) => String(value).padStart(2, '0')

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`
  }

  return `${pad(minutes)}:${pad(seconds)}`
}

export type LivestreamCallStats = {
  durationLabel: string
  isCallLive: boolean
  participantCount: number
  participantLabel: string
}

export function useLivestreamCallStats(): LivestreamCallStats {
  const { useCallSession, useIsCallLive, useParticipantCount } = useCallStateHooks()
  const participantCount = useParticipantCount()
  const isCallLive = Boolean(useIsCallLive())
  const session = useCallSession()
  const [durationSeconds, setDurationSeconds] = useState(0)

  const liveStartedAt = session?.live_started_at

  useEffect(() => {
    if (!isCallLive || !liveStartedAt) {
      setDurationSeconds(0)
      return
    }

    const liveStartTime = new Date(liveStartedAt).getTime()
    if (Number.isNaN(liveStartTime)) {
      setDurationSeconds(0)
      return
    }

    const tick = () => {
      setDurationSeconds(Math.max(0, Math.floor((Date.now() - liveStartTime) / 1000)))
    }

    tick()
    const interval = window.setInterval(tick, 1000)
    return () => window.clearInterval(interval)
  }, [isCallLive, liveStartedAt])

  const participantLabel = useMemo(() => humanize(participantCount), [participantCount])

  return {
    durationLabel: formatLiveDuration(durationSeconds),
    isCallLive,
    participantCount,
    participantLabel,
  }
}

'use client'

import { useEffect } from 'react'

import { useLivestreamCallStats, type LivestreamCallStats } from '@/hooks/useLivestreamCallStats'

export function LivestreamStatsReporter({
  onChange,
}: {
  onChange: (stats: LivestreamCallStats | null) => void
}) {
  const stats = useLivestreamCallStats()

  useEffect(() => {
    onChange(stats.isCallLive ? stats : null)
  }, [
    onChange,
    stats.durationLabel,
    stats.isCallLive,
    stats.participantCount,
    stats.participantLabel,
  ])

  return null
}

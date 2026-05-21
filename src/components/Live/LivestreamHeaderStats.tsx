'use client'

import { Users } from 'lucide-react'

import type { LivestreamCallStats } from '@/hooks/useLivestreamCallStats'
import { cn } from '@/utilities/ui'

export function LivestreamHeaderStats({
  stats,
  className,
}: {
  stats: LivestreamCallStats | null
  className?: string
}) {
  if (!stats) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white/90 ring-1 ring-white/10 backdrop-blur">
        <Users className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
        {stats.participantLabel} người xem
      </span>
      <span className="inline-flex items-center rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium tabular-nums text-white/90 ring-1 ring-white/10 backdrop-blur">
        {stats.durationLabel}
      </span>
    </div>
  )
}

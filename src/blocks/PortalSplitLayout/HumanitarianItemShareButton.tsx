'use client'

import { Share2 } from 'lucide-react'

import { cn } from '@/utilities/ui'

type Props = {
  fragmentId: string
  className?: string
}

export function HumanitarianItemShareButton({ fragmentId, className }: Props) {
  return (
    <button
      aria-label="Chia sẻ"
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white shadow-lg backdrop-blur transition-colors hover:bg-black/70 cursor-pointer active:scale-95',
        className,
      )}
      type="button"
      onClick={async () => {
        const { origin, pathname, search } = window.location
        const base = `${origin}${pathname}${search}`
        const url = `${base}#${encodeURIComponent(fragmentId)}`

        try {
          if (typeof navigator.share === 'function') {
            await navigator.share({ url, title: document.title })
            return
          }
        } catch (err) {
          const name = err instanceof Error ? err.name : ''
          if (name === 'AbortError') return
        }

        try {
          await navigator.clipboard.writeText(url)
        } catch {
          // Clipboard may be denied without gesture or in insecure context
        }
      }}
    >
      <Share2 aria-hidden className="h-5 w-5" />
    </button>
  )
}

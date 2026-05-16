'use client'

import { Forward } from 'lucide-react'

type Props = {
  fragmentId: string
  className?: string
}

export function HumanitarianItemShareButton({ fragmentId, className }: Props) {
  return (
    <button
      className={className}
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
      <Forward className="mr-2 h-4 w-4" />
      Chia sẻ
    </button>
  )
}

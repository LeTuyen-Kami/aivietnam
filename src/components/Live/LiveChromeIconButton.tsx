'use client'

import { forwardRef, type ReactNode } from 'react'

import { cn } from '@/utilities/ui'

export const LiveChromeIconButton = forwardRef<
  HTMLButtonElement,
  {
    ariaLabel: string
    children: ReactNode
    className?: string
    disabled?: boolean
    onClick: () => void
  }
>(function LiveChromeIconButton(
  { ariaLabel, children, className, disabled, onClick },
  ref,
) {
  return (
    <button
      ref={ref}
      aria-label={ariaLabel}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white shadow-lg backdrop-blur transition-colors hover:bg-black/70 disabled:cursor-not-allowed disabled:opacity-45',
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
})

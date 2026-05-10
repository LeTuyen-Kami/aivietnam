'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  value: string
  durationMs?: number
}

function parseAnimatedValue(input: string) {
  const trimmed = input.trim()
  const digitGroups = trimmed.match(/\d+/g) ?? []
  const numericValue = Number(digitGroups.join(''))
  const suffixMatch = trimmed.match(/[^\d.,\s]+$/)

  return {
    numericValue: Number.isFinite(numericValue) ? numericValue : 0,
    suffix: suffixMatch?.[0] ?? '',
  }
}

function formatAnimatedValue(value: number, suffix: string) {
  return `${new Intl.NumberFormat('vi-VN').format(value)}${suffix}`
}

export function AnimatedStatValue({ value, durationMs = 1400 }: Props) {
  const ref = useRef<HTMLParagraphElement | null>(null)
  const hasAnimatedRef = useRef(false)
  const rafRef = useRef(0)
  const [{ numericValue, suffix }] = useState(() => parseAnimatedValue(value))
  const [displayValue, setDisplayValue] = useState(() => formatAnimatedValue(0, suffix))

  useEffect(() => {
    const node = ref.current
    if (!node || hasAnimatedRef.current || numericValue <= 0) {
      if (numericValue <= 0) setDisplayValue(value)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting || hasAnimatedRef.current) return

        hasAnimatedRef.current = true
        const start = performance.now()
        let raf = 0

        const run = (now: number) => {
          const progress = Math.min((now - start) / durationMs, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          const nextValue = Math.round(numericValue * eased)

          setDisplayValue(formatAnimatedValue(nextValue, suffix))

          if (progress < 1) {
            rafRef.current = requestAnimationFrame(run)
          }
        }

        raf = requestAnimationFrame(run)
        rafRef.current = raf
        observer.disconnect()
      },
      { threshold: 0.35 },
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [durationMs, numericValue, suffix, value])

  return (
    <p className="mt-5 text-[14px] font-bold text-slate-800 md:text-[14px]" ref={ref}>
      {displayValue}
    </p>
  )
}

'use client'

import { layoutWithLines, measureNaturalWidth, prepareWithSegments } from '@chenglou/pretext'
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'

const PREPARE_OPTS = { whiteSpace: 'pre-wrap' as const }

type Box = { width: number; font: string; lineHeight: number }

function longestPrefixByWidth(
  lineText: string,
  maxWidthPx: number,
  font: string,
): { prefix: string; fitsFull: boolean } {
  if (maxWidthPx <= 0) {
    return { prefix: '', fitsFull: lineText.length === 0 }
  }
  if (!lineText) {
    return { prefix: '', fitsFull: true }
  }

  try {
    const preparedFull = prepareWithSegments(lineText, font, PREPARE_OPTS)
    const fullW = measureNaturalWidth(preparedFull)
    if (fullW <= maxWidthPx) {
      return { prefix: lineText, fitsFull: true }
    }
  } catch {
    return { prefix: '', fitsFull: false }
  }

  const graphemes = [
    ...new Intl.Segmenter('vi', { granularity: 'grapheme' }).segment(lineText),
  ].map((s) => s.segment)
  let lo = 0
  let hi = graphemes.length
  let best = ''
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    const candidate = graphemes.slice(0, mid).join('')
    try {
      const w = measureNaturalWidth(prepareWithSegments(candidate, font, PREPARE_OPTS))
      if (w <= maxWidthPx) {
        best = candidate
        lo = mid
      } else {
        hi = mid - 1
      }
    } catch {
      hi = mid - 1
    }
  }
  return { prefix: best, fitsFull: false }
}

function reserveForTail(font: string): number {
  try {
    const gap = 4
    const ell = measureNaturalWidth(prepareWithSegments(' … ', font, PREPARE_OPTS))
    const btn = measureNaturalWidth(prepareWithSegments('Xem thêm', font, PREPARE_OPTS))
    return ell + btn + gap
  } catch {
    return 72
  }
}

export type CommentTextClampProps = {
  text: string
  className?: string
  maxLines?: number
}

/**
 * Dùng @chenglou/pretext: bẻ dòng theo đúng width/font; "Xem thêm" nằm cuối dòng thứ `maxLines`.
 */
export function CommentTextClamp({ text, className, maxLines = 3 }: CommentTextClampProps) {
  const [expanded, setExpanded] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const probeRef = useRef<HTMLSpanElement>(null)
  const [box, setBox] = useState<Box>({ width: 0, font: '14px sans-serif', lineHeight: 21 })

  useLayoutEffect(() => {
    const root = rootRef.current
    const probe = probeRef.current
    if (!root || !probe) return

    const read = () => {
      const cs = getComputedStyle(probe)
      const lh = cs.lineHeight
      const fontSize = parseFloat(cs.fontSize) || 14
      const lineHeight =
        lh === 'normal' ? Math.round(fontSize * 1.5) : parseFloat(lh) || Math.round(fontSize * 1.5)
      setBox({
        width: root.clientWidth,
        font: cs.font,
        lineHeight,
      })
    }

    read()
    const ro = new ResizeObserver(read)
    ro.observe(root)
    return () => ro.disconnect()
  }, [])

  const layout = useMemo(() => {
    if (!text || box.width <= 0) return null
    try {
      const prepared = prepareWithSegments(text, box.font, PREPARE_OPTS)
      return layoutWithLines(prepared, box.width, box.lineHeight)
    } catch {
      return null
    }
  }, [text, box])

  const collapsed = useMemo(() => {
    if (!layout || layout.lines.length === 0) return null
    if (layout.lines.length <= maxLines) {
      return { mode: 'full' as const }
    }

    const lines = layout.lines
    const reserved = reserveForTail(box.font)
    const rowBudget = Math.max(0, box.width - reserved)
    const third = lines[maxLines - 1]
    const { prefix, fitsFull } = longestPrefixByWidth(third.text, rowBudget, box.font)
    const showEllipsis = !fitsFull && prefix.length < third.text.length

    return {
      mode: 'clamped' as const,
      headLines: lines.slice(0, maxLines - 1),
      thirdFull: third.text,
      prefix,
      showEllipsis,
    }
  }, [layout, box, maxLines])

  if (expanded) {
    return (
      <div className={cn('mt-2', className)}>
        <p className="whitespace-pre-wrap wrap-break-word text-sm">{text}</p>
        <Button
          className="mt-1 h-auto p-0 text-xs font-normal hover:text-primary/90 cursor-pointer text-blue-500"
          type="button"
          variant="link"
          onClick={() => setExpanded(false)}
        >
          Thu gọn
        </Button>
      </div>
    )
  }

  return (
    <div ref={rootRef} className={cn('relative mt-2', className)}>
      <span
        ref={probeRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 text-sm opacity-0"
      >
        A
      </span>

      {!layout || box.width <= 0 ? (
        <p className="whitespace-pre-wrap wrap-break-word text-sm">{text}</p>
      ) : collapsed?.mode === 'full' ? (
        <p className="whitespace-pre-wrap wrap-break-word text-sm">{text}</p>
      ) : collapsed?.mode === 'clamped' ? (
        <>
          {collapsed.headLines.map((line, i) => (
            <p
              key={`hl-${i}`}
              className="whitespace-pre-wrap wrap-break-word text-sm leading-normal"
            >
              {line.text}
            </p>
          ))}
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-1 text-sm leading-normal">
            <span className="min-w-0 whitespace-pre-wrap wrap-break-word">{collapsed.prefix}</span>
            {collapsed.showEllipsis ? (
              <span className="shrink-0 text-muted-foreground" aria-hidden>
                …
              </span>
            ) : null}
            <Button
              className="h-auto shrink-0 p-0 text-xs font-normal hover:text-primary/90 cursor-pointer text-blue-500"
              type="button"
              variant="link"
              onClick={() => setExpanded(true)}
            >
              Xem thêm
            </Button>
          </div>
        </>
      ) : (
        <p className="whitespace-pre-wrap wrap-break-word text-sm">{text}</p>
      )}
    </div>
  )
}

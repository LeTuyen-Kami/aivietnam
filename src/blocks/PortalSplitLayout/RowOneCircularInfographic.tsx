'use client'

import type { PortalSplitLayoutBlock } from '@/payload-types'

import type { CSSProperties } from 'react'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'

import { Media as MediaComponent } from '@/components/Media'

import { cn } from '@/utilities/ui'

import { accentHover } from './accent'
import { normalizeOrbitRadiusPct, type OrbitRadiusPct } from './orbitRadius'
import { SmartLink } from '@/components/SmartLink'

type Props = Pick<
  PortalSplitLayoutBlock,
  'row1CenterGraphic' | 'row1TagItems' | 'row1OrbitRadiusMinPct' | 'row1OrbitRadiusMaxPct'
>

type TagRow = NonNullable<PortalSplitLayoutBlock['row1TagItems']>[number]

type OrbitPlacement = {
  tag: TagRow
  angleFromTopDeg: number
  index: number
  reactKey: string
}

/** 0° = top (12 o’clock), clockwise — arc from -45° to 225° (270° span). */
const ARC_START_DEG = 0
const ARC_END_DEG = 360
const ARC_MARGIN_DEG = 2
const GAP_PX = 4

function degAtan(x: number): number {
  return (180 / Math.PI) * Math.atan(x)
}

/** Even fallback before measure / if layout fails. */
function buildUniformArcPlacements(tags: TagRow[]): OrbitPlacement[] {
  const n = tags.length
  if (n === 0) return []

  const span = ARC_END_DEG - ARC_START_DEG
  return tags.map((tag, i) => ({
    tag,
    index: i,
    angleFromTopDeg:
      n === 1 ? (ARC_START_DEG + ARC_END_DEG) / 2 : ARC_START_DEG + (span * i) / (n - 1),
    reactKey: tag.id != null ? `orbit-${tag.id}-${i}` : `orbit-${i}-${tag.label}`,
  }))
}

/**
 * Angular half-width (degrees) of a tag of width `wPx` on a circle of radius `rPx`
 * (tag kept horizontal; tangent extent dominates).
 */
function halfAngularDeg(wPx: number, rPx: number): number {
  const r = Math.max(rPx, 1)
  return degAtan(wPx / (2 * r))
}

function gapAngularDeg(rPx: number): number {
  const r = Math.max(rPx, 1)
  return degAtan(GAP_PX / r)
}

function fitsArc(widthsPx: number[], rPx: number): boolean {
  const n = widthsPx.length
  if (n <= 1) return true

  const hd = widthsPx.map((w) => halfAngularDeg(w, rPx))
  const gd = gapAngularDeg(rPx)

  let θ = ARC_START_DEG + ARC_MARGIN_DEG + hd[0]
  for (let i = 0; i < n - 1; i++) {
    θ += hd[i] + hd[i + 1] + gd
  }

  return θ + hd[n - 1] <= ARC_END_DEG - ARC_MARGIN_DEG
}

function buildAnglesFromWidths(widthsPx: number[], rPx: number): number[] {
  const n = widthsPx.length
  if (n === 0) return []
  if (n === 1) return [(ARC_START_DEG + ARC_END_DEG) / 2]

  const hd = widthsPx.map((w) => halfAngularDeg(w, rPx))
  const gd = gapAngularDeg(rPx)

  const angles: number[] = []
  angles[0] = ARC_START_DEG + ARC_MARGIN_DEG + hd[0]
  for (let i = 0; i < n - 1; i++) {
    angles[i + 1] = angles[i] + hd[i] + hd[i + 1] + gd
  }
  return angles
}

/** Linearly map center angles so first/last sit inside the arc (last resort if R max still overflows). */
function squeezeCentersIntoArc(anglesDeg: number[], widthsPx: number[], rPx: number): number[] {
  const n = anglesDeg.length
  if (n <= 1) return anglesDeg

  const hd = widthsPx.map((w) => halfAngularDeg(w, rPx))
  const minC = ARC_START_DEG + ARC_MARGIN_DEG + hd[0]
  const maxC = ARC_END_DEG - ARC_MARGIN_DEG - hd[n - 1]
  const a0 = anglesDeg[0]
  const aL = anglesDeg[n - 1]
  const span = aL - a0
  if (span < 1e-6) return anglesDeg

  return anglesDeg.map((θ) => minC + ((θ - a0) / span) * (maxC - minC))
}

/** Tailwind `md` — mobile-only orbit / layout tweaks use max-width viewport. */
const MOBILE_ORBIT_MQ = '(max-width: 767px)'

/**
 * Binary search smallest orbit radius so tangent gaps fit; if impossible at max R, squeeze angles.
 * When `applyMobileGeomCap`, tighten max radius so wide labels fit inside the square (narrow viewports).
 */
function resolveOrbitAndAngles(
  widthsPx: number[],
  containerMinPx: number,
  orbitPct: OrbitRadiusPct,
  applyMobileGeomCap: boolean,
): {
  anglesDeg: number[]
  orbitRpx: number
} {
  const n = widthsPx.length

  if (n === 0) {
    return { anglesDeg: [], orbitRpx: containerMinPx * (orbitPct.rMinPct / 100) * 0.5 }
  }
  if (n === 1) {
    const singlePct = (orbitPct.rMinPct + orbitPct.rMaxPct) / 2
    const orbitDesired = Math.min(containerMinPx * (singlePct / 100), 120)
    if (!applyMobileGeomCap) {
      return {
        anglesDeg: [(ARC_START_DEG + ARC_END_DEG) / 2],
        orbitRpx: orbitDesired,
      }
    }
    const maxHalfWidth = Math.max(...widthsPx) / 2
    const rGeomCap = containerMinPx / 2 - maxHalfWidth - 8
    return {
      anglesDeg: [(ARC_START_DEG + ARC_END_DEG) / 2],
      orbitRpx: Math.max(0, Math.min(orbitDesired, rGeomCap)),
    }
  }

  const rMin = containerMinPx * (orbitPct.rMinPct / 100)
  const rMaxDesired = containerMinPx * (orbitPct.rMaxPct / 100)
  let rMax = rMaxDesired
  if (applyMobileGeomCap) {
    const maxHalfWidth = Math.max(...widthsPx) / 2
    const rGeomCap = containerMinPx / 2 - maxHalfWidth - 8
    rMax = Math.max(rMin, Math.min(rMaxDesired, rGeomCap))
  }

  if (fitsArc(widthsPx, rMin)) {
    return { anglesDeg: buildAnglesFromWidths(widthsPx, rMin), orbitRpx: rMin }
  }

  if (!fitsArc(widthsPx, rMax)) {
    const raw = buildAnglesFromWidths(widthsPx, rMax)
    return { anglesDeg: squeezeCentersIntoArc(raw, widthsPx, rMax), orbitRpx: rMax }
  }

  let lo = rMin
  let hi = rMax
  for (let k = 0; k < 32; k++) {
    const mid = (lo + hi) / 2
    if (fitsArc(widthsPx, mid)) hi = mid
    else lo = mid
  }

  const r = hi
  return { anglesDeg: buildAnglesFromWidths(widthsPx, r), orbitRpx: r }
}

function RowOneCircularInfographic({
  row1CenterGraphic,
  row1TagItems,
  row1OrbitRadiusMinPct,
  row1OrbitRadiusMaxPct,
}: Props) {
  const hasGraphic = typeof row1CenterGraphic === 'object' && row1CenterGraphic
  const tags = row1TagItems ?? []
  const hasTags = tags.length > 0

  const orbitPct = useMemo(
    () => normalizeOrbitRadiusPct(row1OrbitRadiusMinPct, row1OrbitRadiusMaxPct),
    [row1OrbitRadiusMinPct, row1OrbitRadiusMaxPct],
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const blockRefs = useRef<(HTMLDivElement | null)[]>([])

  const uniform = useMemo(() => buildUniformArcPlacements(tags), [tags])
  const [anglesDeg, setAnglesDeg] = useState<number[] | null>(null)
  const [orbitRpx, setOrbitRpx] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el || tags.length === 0) return

    const mq = window.matchMedia(MOBILE_ORBIT_MQ)

    const run = () => {
      const rect = el.getBoundingClientRect()
      const size = Math.min(rect.width, rect.height)
      if (size < 8) return

      const widths = tags.map((_, i) => {
        const b = blockRefs.current[i]
        return b?.getBoundingClientRect().width ?? 0
      })

      if (widths.some((w) => w < 1)) return

      const applyMobileGeomCap = mq.matches
      const { anglesDeg: nextAngles, orbitRpx: nextR } = resolveOrbitAndAngles(
        widths,
        size,
        orbitPct,
        applyMobileGeomCap,
      )
      setAnglesDeg(nextAngles)
      setOrbitRpx(nextR)
    }

    run()
    const raf = requestAnimationFrame(run)

    const ro = new ResizeObserver(() => run())
    ro.observe(el)
    mq.addEventListener('change', run)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      mq.removeEventListener('change', run)
    }
  }, [tags, orbitPct])

  if (!hasGraphic && !hasTags) return null

  if (hasGraphic && !hasTags) {
    return (
      <div className="relative mx-auto my-6 flex max-w-md justify-center">
        <MediaComponent
          className="w-full"
          imgClassName="mx-auto max-h-80 w-auto object-contain"
          resource={row1CenterGraphic}
          size="(max-width: 1024px) 100vw, 40vw"
        />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative mx-auto -my-10 md:my-4 aspect-square w-full max-w-[min(100%,28rem)] z-0',
      )}
      style={
        orbitRpx != null
          ? ({ ['--orbit-r' as string]: `${orbitRpx}px` } as CSSProperties)
          : undefined
      }
      aria-label="Circular keyword layout"
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-80 dark:opacity-45"
        style={{
          background:
            'radial-gradient(circle at 50% 48%, rgba(255,255,255,0.75) 0%, transparent 52%), radial-gradient(circle at 50% 50%, rgba(14,165,233,0.05) 0%, transparent 58%)',
        }}
      />

      {hasGraphic && (
        <div className="absolute left-1/2 top-1/2 z-2 w-[min(40%,8.5rem)] -translate-x-1/2 -translate-y-1/2">
          <div
            className={cn(
              'rounded-full p-[3px]',
              'bg-linear-to-b from-white to-[#ebe6dc]',
              'shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_0_52px_-10px_rgba(14,165,233,0.28),0_20px_44px_-18px_rgba(15,23,42,0.22)]',
              'dark:from-slate-800 dark:to-slate-900',
              'dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_0_56px_-10px_rgba(56,189,248,0.2),0_22px_48px_-18px_rgba(0,0,0,0.65)]',
            )}
          >
            <div className="overflow-hidden aspect-square rounded-full bg-[#faf8f3] ring-1 ring-black/5 dark:bg-slate-900/90 dark:ring-white/8">
              <MediaComponent
                className="w-full"
                imgClassName="object-cover w-full h-full"
                resource={row1CenterGraphic}
                size="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          </div>
        </div>
      )}

      {uniform.map((p, i) => {
        const { tag, index, reactKey } = p
        const α = anglesDeg?.[i] ?? p.angleFromTopDeg
        const linkClass = cn(
          'block max-w-[11rem] text-pretty text-center font-serif sm:max-w-[12.5rem] text-sm md:text-base',
          accentHover.link,
        )

        const inner = tag.href?.trim() ? (
          <SmartLink className={linkClass} href={tag.href.trim()}>
            {tag.label}
          </SmartLink>
        ) : (
          <span
            className={cn(
              'block max-w-44 text-pretty text-center font-serif sm:max-w-50 text-sm md:text-base',
            )}
          >
            {tag.label}
          </span>
        )

        return (
          <div
            key={reactKey}
            ref={(node) => {
              blockRefs.current[i] = node
            }}
            className="absolute left-1/2 top-1/2 z-3 origin-center will-change-transform"
            style={{
              transform: `translate(-50%, -50%) rotate(${α}deg) translateY(calc(-1 * var(--orbit-r, clamp(4.25rem, 22vmin, 7.25rem)))) rotate(${-α}deg)`,
              zIndex: 1 + i,
            }}
          >
            <div
              className={cn(
                'pointer-events-auto inline-block w-max max-w-[min(11rem,42vw)] rounded-sm  antialiased px-3 py-2 cursor-pointer',
              )}
            >
              {inner}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default RowOneCircularInfographic

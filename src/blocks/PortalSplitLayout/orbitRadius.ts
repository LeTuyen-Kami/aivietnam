export type OrbitRadiusPct = { rMinPct: number; rMaxPct: number }

const DEFAULT_ORBIT_PCT: OrbitRadiusPct = { rMinPct: 16, rMaxPct: 52 }

/** Clamp CMS values so the layout always has a valid search range. */
export function normalizeOrbitRadiusPct(
  minPct: number | null | undefined,
  maxPct: number | null | undefined,
): OrbitRadiusPct {
  let min =
    typeof minPct === 'number' && Number.isFinite(minPct) ? minPct : DEFAULT_ORBIT_PCT.rMinPct
  let max =
    typeof maxPct === 'number' && Number.isFinite(maxPct) ? maxPct : DEFAULT_ORBIT_PCT.rMaxPct
  min = Math.min(55, Math.max(6, min))
  max = Math.min(65, Math.max(15, max))
  if (min >= max) {
    max = min + 4
  }
  return { rMinPct: min, rMaxPct: max }
}

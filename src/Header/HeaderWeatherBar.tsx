'use client'

import React, { useEffect, useState } from 'react'

const DIVISIONS_URL = 'https://dbthoitiet.com/api/divisions?depth=1'
/** Giống curl từ máy user — CDN nhìn đúng IP trình duyệt; DB VN thường khớp thực tế hơn ip-api. */
const VNE_IP_LOOKUP = 'https://adp.vnecdn.net/iplookup'
const IPIFY_URL = 'https://api.ipify.org?format=json'
const GEO_IP_API = '/api/geo-ip'

type Division = {
  code: number
  name: string
  lat: number
  lng: number
}

type WeatherResponse = {
  success: boolean
  province_name?: string
  current?: {
    temperature_2m: number
    relative_humidity_2m: number
  }
}

let divisionsCache: Division[] | null = null
let divisionsInflight: Promise<Division[]> | null = null

async function loadDivisions(): Promise<Division[]> {
  if (divisionsCache) return divisionsCache
  if (!divisionsInflight) {
    divisionsInflight = fetch(DIVISIONS_URL)
      .then((r) => {
        if (!r.ok) throw new Error('divisions')
        return r.json() as Promise<{ success: boolean; data: Division[] }>
      })
      .then((body) => {
        if (!body.success || !Array.isArray(body.data)) throw new Error('divisions')
        divisionsCache = body.data
        return divisionsCache
      })
      .finally(() => {
        divisionsInflight = null
      })
  }
  return divisionsInflight
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function nearestProvinceCode(lat: number, lng: number, divisions: Division[]): number {
  let best = divisions[0]!
  let bestD = haversineKm(lat, lng, best.lat, best.lng)
  for (let i = 1; i < divisions.length; i++) {
    const d = divisions[i]!
    const dist = haversineKm(lat, lng, d.lat, d.lng)
    if (dist < bestD) {
      bestD = dist
      best = d
    }
  }
  return best.code
}

function normalizeVi(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Khớp "Ho Chi Minh" / "Hồ Chí Minh" với tên tỉnh DBThoiTiet (tránh ip-api đẩy nhầm về Cần Thơ). */
function matchDivisionByProvinceHint(hint: string, divisions: Division[]): Division | null {
  const cleaned = hint
    .replace(/\bcity\b/gi, '')
    .replace(/\bprovince\b/gi, '')
    .trim()
  if (!cleaned) return null
  const h = normalizeVi(cleaned)
  const hintWords = h.split(/\s+/).filter((w) => w.length > 1)
  if (hintWords.length === 0) return null

  let best: Division | null = null
  let bestScore = 0
  for (const d of divisions) {
    const dn = normalizeVi(d.name)
    const score = hintWords.filter((w) => dn.includes(w)).length
    if (score > bestScore) {
      bestScore = score
      best = d
    }
  }
  return bestScore === hintWords.length ? best : null
}

type VneIpLookupBody = {
  error: number
  data?: {
    latitude?: string
    longitude?: string
    province_name?: string
    city?: string
  }
}

async function tryVnExpressIplookup(): Promise<{
  lat: number
  lng: number
  province_name?: string
  city?: string
} | null> {
  try {
    const r = await fetch(VNE_IP_LOOKUP, {
      cache: 'no-store',
      headers: { accept: '*/*' },
    })
    if (!r.ok) return null
    const body = (await r.json()) as VneIpLookupBody
    if (body.error !== 0 || !body.data) return null
    const lat = parseFloat(body.data.latitude ?? '')
    const lng = parseFloat(body.data.longitude ?? '')
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null
    return {
      lat,
      lng,
      province_name: body.data.province_name?.trim() || undefined,
      city: body.data.city?.trim() || undefined,
    }
  } catch {
    return null
  }
}

type GeoIpResponse = {
  lat: number
  lng: number
  error?: string
}

async function fetchCoordsFromGeoApiFallback(): Promise<{ lat: number; lng: number }> {
  let geoUrl = GEO_IP_API
  try {
    const ir = await fetch(IPIFY_URL, { cache: 'no-store' })
    if (ir.ok) {
      const ij = (await ir.json()) as { ip?: string }
      const ip = ij.ip?.trim()
      if (ip) geoUrl = `${GEO_IP_API}?ip=${encodeURIComponent(ip)}`
    }
  } catch {
    // dùng header / auto trên server
  }

  const r = await fetch(geoUrl, { cache: 'no-store' })
  if (!r.ok) throw new Error('ipgeo')
  const body = (await r.json()) as GeoIpResponse
  if (
    typeof body.lat !== 'number' ||
    typeof body.lng !== 'number' ||
    Number.isNaN(body.lat) ||
    Number.isNaN(body.lng)
  ) {
    throw new Error('ipgeo')
  }
  return { lat: body.lat, lng: body.lng }
}

function ThermometerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M10 3v10.2a4 4 0 1 0 4 0V3a2 2 0 1 0-4 0Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="17" r="3.5" fill="#ef4444" />
    </svg>
  )
}

function DropletIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 21c-3.5 0-6-2.2-6-5.5C6 11.8 12 4 12 4s6 7.8 6 11.5C18 18.8 15.5 21 12 21Z"
        fill="#38bdf8"
        stroke="#0ea5e9"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export const HeaderWeatherBar: React.FC = () => {
  const [label, setLabel] = useState('Đang tải địa điểm...')
  const [temp, setTemp] = useState<string | null>(null)
  const [humidity, setHumidity] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setTemp(null)
      setHumidity(null)
      setLabel('Đang tải địa điểm...')

      const divisions = await loadDivisions()
      if (cancelled) return

      const vne = await tryVnExpressIplookup()
      let code: number
      let provinceName: string

      if (vne) {
        const byHint =
          matchDivisionByProvinceHint(vne.province_name ?? '', divisions) ??
          (vne.city ? matchDivisionByProvinceHint(vne.city, divisions) : null)
        if (byHint) {
          code = byHint.code
          provinceName = byHint.name
        } else {
          code = nearestProvinceCode(vne.lat, vne.lng, divisions)
          provinceName = divisions.find((d) => d.code === code)?.name ?? `Mã ${code}`
        }
      } else {
        const { lat, lng } = await fetchCoordsFromGeoApiFallback()
        if (cancelled) return
        code = nearestProvinceCode(lat, lng, divisions)
        provinceName = divisions.find((d) => d.code === code)?.name ?? `Mã ${code}`
      }

      setLabel(provinceName)

      const weatherRes = await fetch(
        `https://dbthoitiet.com/api/weather?province_code=${encodeURIComponent(String(code))}`,
      )
      if (!weatherRes.ok) throw new Error('weather')
      const weather = (await weatherRes.json()) as WeatherResponse
      if (cancelled) return

      if (!weather.success || !weather.current) throw new Error('weather')

      setTemp(String(Math.round(weather.current.temperature_2m)))
      setHumidity(`${Math.round(weather.current.relative_humidity_2m)}%`)
    }

    run().catch((err) => {
      if (cancelled) return
      if (err instanceof Error && err.message === 'weather') {
        setLabel((prev) => (prev === 'Đang tải địa điểm...' ? 'Không tải được thời tiết' : prev))
        return
      }
      setLabel('Không lấy được vị trí')
    })

    return () => {
      cancelled = true
    }
  }, [])

  const showPlaceholders = temp === null || humidity === null

  return (
    <div
      className="flex w-fit min-w-0 items-center justify-between gap-2 text-sm text-foreground"
      role="status"
      aria-live="polite"
    >
      <span className="truncate font-medium">{label}</span>
      <div className="flex shrink-0 items-center gap-4 text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <ThermometerIcon className="shrink-0 text-foreground/70" />
          <span className="tabular-nums text-foreground">{showPlaceholders ? '—' : temp}</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <DropletIcon className="shrink-0" />
          <span className="tabular-nums text-foreground">{showPlaceholders ? '—%' : humidity}</span>
        </span>
      </div>
    </div>
  )
}

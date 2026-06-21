import { NextRequest, NextResponse } from 'next/server'

import { clientIpFromHeaders, rateLimit } from '@/utilities/rateLimit'

const IPGEO_URL = 'https://api.ipgeolocation.io/v3/ipgeo'

/** Fallback khi chưa cấu hình IPGEOLOCATION_API_KEY */
const IP_API_FIELDS = 'status,message,country,regionName,city,lat,lon,timezone'

export const dynamic = 'force-dynamic'

function clientIp(req: NextRequest): string | null {
  const cf = req.headers.get('cf-connecting-ip')
  if (cf?.trim()) return cf.trim()
  const fwd = req.headers.get('x-forwarded-for')
  const first = fwd?.split(',')[0]?.trim()
  if (first) return first
  const real = req.headers.get('x-real-ip')
  if (real?.trim()) return real.trim()
  return null
}

function isPublicRoutableIp(ip: string): boolean {
  const s = ip.trim().toLowerCase()
  if (!s || s === 'unknown' || s === 'localhost') return false
  if (s === '::1' || s === '0:0:0:0:0:0:0:1') return false
  if (s.startsWith('127.')) return false
  if (s.startsWith('10.')) return false
  if (s.startsWith('192.168.')) return false
  const m172 = /^172\.(\d+)\./.exec(s)
  if (m172) {
    const n = Number(m172[1])
    if (n >= 16 && n <= 31) return false
  }
  if (s.startsWith('::ffff:')) return isPublicRoutableIp(s.slice(7))
  if (s.startsWith('fe80:')) return false
  if (s.startsWith('fc') || s.startsWith('fd')) return false
  return true
}

type IpGeoLocationResponse = {
  message?: string
  location?: {
    country_name?: string
    state_prov?: string
    city?: string
    latitude?: string
    longitude?: string
  }
  time_zone?: {
    name?: string
  }
}

async function lookupIpGeolocation(ip: string | null, apiKey: string): Promise<NextResponse> {
  const params = new URLSearchParams({ apiKey })
  if (ip) params.set('ip', ip)
  const url = `${IPGEO_URL}?${params}`

  let res: Response
  try {
    res = await fetch(url, { cache: 'no-store' })
  } catch {
    return NextResponse.json({ error: 'ipgeolocation' }, { status: 502 })
  }

  if (!res.ok) {
    return NextResponse.json({ error: 'ipgeolocation' }, { status: 502 })
  }

  const data = (await res.json()) as IpGeoLocationResponse
  if (data.message || !data.location) {
    return NextResponse.json({ error: data.message ?? 'ipgeolocation' }, { status: 502 })
  }

  const lat = parseFloat(data.location.latitude ?? '')
  const lng = parseFloat(data.location.longitude ?? '')
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: 'ipgeolocation' }, { status: 502 })
  }

  return NextResponse.json({
    lat,
    lng,
    country: data.location.country_name,
    regionName: data.location.state_prov,
    city: data.location.city,
    timezone: data.time_zone?.name,
  })
}

async function lookupIpApi(ip: string | null): Promise<NextResponse> {
  const url = ip
    ? `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=${IP_API_FIELDS}`
    : `http://ip-api.com/json/?fields=${IP_API_FIELDS}`

  let res: Response
  try {
    res = await fetch(url, { cache: 'no-store' })
  } catch {
    return NextResponse.json({ error: 'ip-api' }, { status: 502 })
  }

  if (!res.ok) {
    return NextResponse.json({ error: 'ip-api' }, { status: 502 })
  }

  const data = (await res.json()) as {
    status: string
    message?: string
    country?: string
    regionName?: string
    city?: string
    lat?: number
    lon?: number
    timezone?: string
  }

  if (data.status !== 'success' || typeof data.lat !== 'number' || typeof data.lon !== 'number') {
    return NextResponse.json({ error: data.message ?? 'ip-api' }, { status: 502 })
  }

  return NextResponse.json({
    lat: data.lat,
    lng: data.lon,
    country: data.country,
    regionName: data.regionName,
    city: data.city,
    timezone: data.timezone,
  })
}

/**
 * Ưu tiên `?ip=` (ipify từ client). IPGeolocation.io (HTTPS + key trong env).
 * Thiếu `IPGEOLOCATION_API_KEY` → fallback ip-api (HTTP).
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  // Mỗi request là 1 outbound lookup dùng API key trả phí -> rate-limit theo IP
  // để tránh bị đốt quota / ban egress (audit M-f).
  if (!rateLimit(`geo-ip:${clientIpFromHeaders(req)}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const q = req.nextUrl.searchParams.get('ip')?.trim()
  const fromQuery = q && isPublicRoutableIp(q) ? q : null
  const raw = clientIp(req)
  const fromHeader = raw && isPublicRoutableIp(raw) ? raw : null
  const ip = fromQuery ?? fromHeader ?? null

  const key = process.env.IPGEOLOCATION_API_KEY?.trim()
  if (key) {
    return lookupIpGeolocation(ip, key)
  }
  return lookupIpApi(ip)
}

'use client'

import { cn } from '@/utilities/ui'
import { Droplets, Thermometer } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import React, { useEffect, useMemo, useState } from 'react'

const DIVISIONS_URL = 'https://dbthoitiet.com/api/divisions?depth=1'

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

function normalizeVi(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

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

/** Ba thành phố cố định: gợi ý để khớp tên trong DB dbthoitiet. */
const FIXED_CITIES: { label: string; divisionHints: string[] }[] = [
  { label: 'Hà Nội', divisionHints: ['Hà Nội', 'Thành phố Hà Nội'] },
  { label: 'Đà Nẵng', divisionHints: ['Đà Nẵng', 'Thành phố Đà Nẵng'] },
  {
    label: 'Hồ Chí Minh',
    divisionHints: ['Thành phố Hồ Chí Minh', 'Hồ Chí Minh', 'Ho Chi Minh'],
  },
]

function resolveDivision(
  { divisionHints }: (typeof FIXED_CITIES)[number],
  divisions: Division[],
): Division | null {
  for (const hint of divisionHints) {
    const d = matchDivisionByProvinceHint(hint, divisions)
    if (d) return d
  }
  return null
}

function formatVietnameseDate(date: Date): string {
  const weekday = new Intl.DateTimeFormat('vi-VN', { weekday: 'long' }).format(date)
  const dayMonthYear = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)

  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${dayMonthYear}`
}

type CityWeather = {
  label: string
  temp: string | null
  humidity: string | null
}

const SLOT_COUNT = FIXED_CITIES.length + 1 /** + ngày */

export const HeaderWeatherBar: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
  const [cityWeathers, setCityWeathers] = useState<CityWeather[]>(() =>
    FIXED_CITIES.map((c) => ({ label: c.label, temp: null, humidity: null })),
  )
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeSlot, setActiveSlot] = useState(0)
  const [now, setNow] = useState(() => new Date())

  const dateLabel = useMemo(() => formatVietnameseDate(now), [now])

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveSlot((i) => (i + 1) % SLOT_COUNT)
      setNow(new Date())
    }, 5000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoadError(null)
      try {
        const divisions = await loadDivisions()
        if (cancelled) return

        const results = await Promise.all(
          FIXED_CITIES.map(async (city) => {
            const division = resolveDivision(city, divisions)
            if (!division) {
              return { label: city.label, temp: null, humidity: null } satisfies CityWeather
            }
            try {
              const weatherRes = await fetch(
                `https://dbthoitiet.com/api/weather?province_code=${encodeURIComponent(String(division.code))}`,
              )
              if (!weatherRes.ok) throw new Error('weather')
              const weather = (await weatherRes.json()) as WeatherResponse
              if (!weather.success || !weather.current) throw new Error('weather')
              return {
                label: city.label,
                temp: String(Math.round(weather.current.temperature_2m)),
                humidity: `${Math.round(weather.current.relative_humidity_2m)}%`,
              } satisfies CityWeather
            } catch {
              return { label: city.label, temp: null, humidity: null } satisfies CityWeather
            }
          }),
        )
        if (!cancelled) setCityWeathers(results)
      } catch {
        if (!cancelled) setLoadError('Không tải được thời tiết')
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const isDateSlot = activeSlot === FIXED_CITIES.length
  const city = !isDateSlot ? cityWeathers[activeSlot] : null
  const showPlaceholders =
    !isDateSlot && (city?.temp === null || city?.humidity === null) && !loadError

  const renderCityRow = () => {
    if (!city) return null
    return (
      <div className="flex shrink-0 items-center gap-4 text-muted-foreground justify-between md:justify-start w-full">
        <span className="block truncate font-medium text-black">{city.label}</span>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5">
            <Thermometer className="h-4 w-4 shrink-0 text-orange-500" strokeWidth={2} />
            <span className="tabular-nums text-foreground">{showPlaceholders ? '—' : city.temp}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Droplets className="h-4 w-4 shrink-0 text-sky-500" strokeWidth={2} />
            <span className="tabular-nums text-foreground">
              {showPlaceholders ? '—%' : city.humidity}
            </span>
          </span>
        </div>
      </div>
    )
  }

  const motionKey = isDateSlot ? 'date' : `city-${activeSlot}`

  return (
    <div
      className={cn(
        'flex w-fit min-w-0 items-center justify-between gap-2 text-sm text-foreground',
        isMobile ? 'w-full' : '',
      )}
      role="status"
      aria-live="polite"
    >
      <div className="min-w-0 overflow-hidden w-full md:w-fit">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={motionKey}
            className="block truncate font-medium text-black"
            initial={{ rotateX: 90, opacity: 0, y: 8 }}
            animate={{ rotateX: 0, opacity: 1, y: 0 }}
            exit={{ rotateX: -90, opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            style={{ transformOrigin: 'center center', transformStyle: 'preserve-3d' }}
          >
            {isDateSlot ? (
              dateLabel
            ) : loadError && showPlaceholders ? (
              <span className="text-muted-foreground">{loadError}</span>
            ) : (
              renderCityRow()
            )}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  )
}

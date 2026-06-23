'use client'

import { cn } from '@/utilities/ui'
import { Droplets, Thermometer } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import React, { useEffect, useMemo, useState } from 'react'

type WeatherResponse = {
  current?: {
    temperature_2m: number
    relative_humidity_2m: number
  }
}

/** Ba thành phố cố định kèm toạ độ để truy vấn Open-Meteo (miễn phí, không cần API key). */
const FIXED_CITIES: { label: string; lat: number; lng: number }[] = [
  { label: 'Hà Nội', lat: 21.0285, lng: 105.8542 },
  { label: 'Đà Nẵng', lat: 16.0544, lng: 108.2022 },
  { label: 'Hồ Chí Minh', lat: 10.7626, lng: 106.6602 },
]

function weatherUrl(lat: number, lng: number): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: 'temperature_2m,relative_humidity_2m',
  })
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`
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

      const results = await Promise.all(
        FIXED_CITIES.map(async (city) => {
          try {
            const res = await fetch(weatherUrl(city.lat, city.lng))
            if (!res.ok) throw new Error('weather')
            const weather = (await res.json()) as WeatherResponse
            if (!weather.current) throw new Error('weather')
            return {
              label: city.label,
              temp: `${Math.round(weather.current.temperature_2m)}°`,
              humidity: `${Math.round(weather.current.relative_humidity_2m)}%`,
            } satisfies CityWeather
          } catch {
            return { label: city.label, temp: null, humidity: null } satisfies CityWeather
          }
        }),
      )

      if (cancelled) return
      setCityWeathers(results)
      if (results.every((c) => c.temp === null)) {
        setLoadError('Không tải được thời tiết')
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const isDateSlot = activeSlot === FIXED_CITIES.length
  const city = !isDateSlot ? cityWeathers[activeSlot] : null
  const showPlaceholders = !isDateSlot && (city?.temp === null || city?.humidity === null)

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
            ) : loadError ? (
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

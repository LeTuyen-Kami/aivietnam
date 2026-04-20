'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'

import type { GeneralSetting, Header, Media } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'
import { HeaderWeatherBar } from './HeaderWeatherBar'
import { useAuth } from '@/providers/Auth'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { SearchIcon } from 'lucide-react'

interface HeaderClientProps {
  data: Header
  generalSettings: GeneralSetting
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data, generalSettings }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()
  const { user, loading: authLoading, openAuthModal, logout } = useAuth()
  const logoMedia =
    typeof generalSettings?.logo === 'object' ? (generalSettings.logo as Media) : null
  const bannerMedia = typeof data?.bannerImage === 'object' ? (data.bannerImage as Media) : null

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  // const themeProps = theme ? { 'data-theme': theme } : {}
  const themeProps = {}

  return (
    <>
      {bannerMedia?.url && (
        <div className="relative z-10 w-full" {...themeProps}>
          {data?.bannerLink ? (
            <Link
              href={data.bannerLink}
              className="block relative overflow-hidden aspect-[5] w-full"
              aria-label="Header banner"
            >
              <Image
                alt={bannerMedia.alt || 'Banner'}
                src={getMediaUrl(bannerMedia.url, bannerMedia.updatedAt)}
                fill
                priority
                className="object-cover"
              />
            </Link>
          ) : (
            <div className="relative overflow-hidden aspect-[5] w-full">
              <Image
                alt={bannerMedia.alt || 'Banner'}
                src={getMediaUrl(bannerMedia.url, bannerMedia.updatedAt)}
                fill
                priority
                className="object-cover"
              />
            </div>
          )}
        </div>
      )}

      {/* Top-level sticky block (banner is a sibling so this still spans the whole scroll) */}
      <header className="sticky top-0 z-[1] w-full shadow-sm" {...themeProps}>
        <div className="flex w-full items-center border-b border-border/60 bg-background px-4 py-2 supports-backdrop-filter:bg-background/90 supports-backdrop-filter:backdrop-blur-md">
          <div className="w-1/3 min-w-0 pr-2">
            <HeaderWeatherBar />
          </div>
          <div className="flex flex-1 items-center justify-center">
            {logoMedia?.url ? (
              <Image
                alt={logoMedia.alt || generalSettings?.siteName || 'Site logo'}
                src={getMediaUrl(logoMedia.url, logoMedia.updatedAt)}
                width={110}
                height={30}
                priority
                className="h-7 w-auto object-contain"
              />
            ) : (
              <Logo
                loading="eager"
                priority="high"
                className="h-7! w-auto! max-w-none invert dark:invert-0"
              />
            )}
          </div>
          <div className="flex w-1/3 items-center justify-end gap-2">
            <Link href="/search">
              <div className="flex items-center rounded-full border border-border px-4 py-2">
                <span className="mr-10 text-sm font-medium text-muted-foreground">Tìm kiếm</span>
                <SearchIcon className="h-4 w-4 text-muted-foreground transition-colors hover:text-foreground" />
              </div>
            </Link>

            {authLoading ? (
              <div
                className="h-9 min-w-22 shrink-0 animate-pulse rounded-full bg-muted/60"
                aria-hidden
              />
            ) : user ? (
              <div className="flex max-w-[min(100%,11rem)] flex-col items-end gap-0.5 text-right sm:max-w-52">
                <span className="truncate text-sm font-medium text-foreground" title={user.email}>
                  {user.name?.trim() || user.email}
                </span>
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  onClick={() => void logout()}
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="shrink-0 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-accent"
                onClick={openAuthModal}
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>

        <div className="bg-[#F1F1F1]">
          <div className="container py-2">
            <HeaderNav data={data} />
          </div>
        </div>
      </header>
    </>
  )
}

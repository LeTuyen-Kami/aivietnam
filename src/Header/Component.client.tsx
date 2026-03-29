'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'

import type { GeneralSetting, Header, Media } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'
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

  return (
    <header className="relative z-20 w-full" {...(theme ? { 'data-theme': theme } : {})}>
      {bannerMedia?.url && (
        <div className="w-full">
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

      <div className="flex items-center px-4 py-2">
        <div className="w-1/3">Thời tiết block</div>
        <div className="flex-1 flex items-center justify-center">
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
        <div className="flex items-center gap-2 w-1/3 justify-end">
          <Link href="/search">
            <div className="flex items-center rounded-full border border-border px-4 py-2">
              <span className="text-sm font-medium mr-10 text-muted-foreground">Tìm kiếm</span>
              <SearchIcon className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
            </div>
          </Link>

          <div>Đăng nhập</div>
        </div>
      </div>

      <div className="bg-[#F1F1F1]">
        <div className="container py-2">
          <HeaderNav data={data} />
        </div>
      </div>
    </header>
  )
}

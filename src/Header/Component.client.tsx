'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { GeneralSetting, Header, Media } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { SmartLink } from '@/components/SmartLink'
import { useAuth } from '@/providers/Auth'
import { cn } from '@/utilities/ui'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import * as Dialog from '@radix-ui/react-dialog'
import { MenuIcon, SearchIcon, UserIcon, X } from 'lucide-react'
import { HeaderWeatherBar } from './HeaderWeatherBar'
import { HeaderNav } from './Nav'

interface HeaderClientProps {
  data: Header
  generalSettings: GeneralSetting
  bannerWidth?: number | null
  bannerHeight?: number | null
  mobileBannerWidth?: number | null
  mobileBannerHeight?: number | null
}

export const HeaderClient: React.FC<HeaderClientProps> = ({
  data,
  generalSettings,
  bannerWidth,
  bannerHeight,
  mobileBannerWidth,
  mobileBannerHeight,
}) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accountSheetOpen, setAccountSheetOpen] = useState(false)

  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()
  const { user, loading: authLoading, openAuthModal, logout } = useAuth()
  const logoMedia =
    typeof generalSettings?.logo === 'object' ? (generalSettings.logo as Media) : null
  const bannerMedia = typeof data?.bannerImage === 'object' ? (data.bannerImage as Media) : null
  const mobileBannerMedia =
    typeof data?.mobileBannerImage === 'object' ? (data.mobileBannerImage as Media) : null

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  useEffect(() => {
    if (!user) setAccountSheetOpen(false)
  }, [user])

  // const themeProps = theme ? { 'data-theme': theme } : {}
  const themeProps = {}
  const desktopBannerAspectRatio =
    bannerWidth && bannerHeight && bannerWidth > 0 && bannerHeight > 0
      ? `${bannerWidth} / ${bannerHeight}`
      : '2524 / 452'
  const mobileBannerAspectRatio =
    mobileBannerWidth && mobileBannerHeight && mobileBannerWidth > 0 && mobileBannerHeight > 0
      ? `${mobileBannerWidth} / ${mobileBannerHeight}`
      : bannerWidth && bannerHeight && bannerWidth > 0 && bannerHeight > 0
        ? `${bannerWidth} / ${bannerHeight}`
        : '1.8 / 1'
  const logoHref = generalSettings?.logoLink?.trim() || '/'
  const logo = logoMedia?.url ? (
    <img
      alt={logoMedia.alt || generalSettings?.siteName || 'Site logo'}
      src={getMediaUrl(logoMedia.url, logoMedia.updatedAt)}
      className="w-[100px]"
    />
  ) : (
    <Logo
      loading="eager"
      priority="high"
      className="h-7! w-auto! max-w-none invert dark:invert-0"
    />
  )

  const accountControl = authLoading ? (
    <div className="h-9 min-w-22 shrink-0 animate-pulse rounded-full bg-muted/60" aria-hidden />
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
      className="shrink-0 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-accent cursor-pointer"
      onClick={openAuthModal}
    >
      Đăng nhập
    </button>
  )

  const mobileAccountControl = authLoading ? (
    <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-muted/60" aria-hidden />
  ) : user ? (
    <button
      type="button"
      className={cn(
        'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer',
        'text-foreground ring-2 ring-primary/40 ring-offset-2 ring-offset-background hover:bg-accent',
      )}
      aria-label="Tài khoản"
      aria-expanded={accountSheetOpen}
      aria-haspopup="dialog"
      onClick={() => setAccountSheetOpen(true)}
    >
      <UserIcon className="h-5 w-5" aria-hidden />
    </button>
  ) : (
    <button
      type="button"
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
      aria-label="Đăng nhập"
      onClick={openAuthModal}
    >
      <UserIcon className="h-5 w-5" />
    </button>
  )

  return (
    <>
      {(bannerMedia?.url || mobileBannerMedia?.url) && (
        <div className="w-full" {...themeProps}>
          {data?.bannerLink ? (
            <>
              {bannerMedia?.url && (
                <SmartLink
                  href={data.bannerLink}
                  className="relative hidden w-full overflow-hidden md:block"
                  style={{ aspectRatio: desktopBannerAspectRatio }}
                  aria-label="Header banner"
                >
                  <Image
                    alt={bannerMedia.alt || 'Banner'}
                    src={getMediaUrl(bannerMedia.url, bannerMedia.updatedAt)}
                    fill
                    priority
                    sizes="100vw"
                    className="object-contain"
                  />
                </SmartLink>
              )}

              {(mobileBannerMedia?.url || bannerMedia?.url) && (
                <SmartLink
                  href={data.bannerLink}
                  className="relative block w-full overflow-hidden md:hidden"
                  style={{ aspectRatio: mobileBannerAspectRatio }}
                  aria-label="Header banner"
                >
                  <Image
                    alt={mobileBannerMedia?.alt || bannerMedia?.alt || 'Banner'}
                    src={getMediaUrl(
                      (mobileBannerMedia || bannerMedia)!.url,
                      (mobileBannerMedia || bannerMedia)!.updatedAt,
                    )}
                    fill
                    priority
                    sizes="100vw"
                    className="object-contain"
                  />
                </SmartLink>
              )}
            </>
          ) : (
            <>
              {bannerMedia?.url && (
                <div
                  className="relative hidden w-full overflow-hidden md:block"
                  style={{ aspectRatio: desktopBannerAspectRatio }}
                >
                  <Image
                    alt={bannerMedia.alt || 'Banner'}
                    src={getMediaUrl(bannerMedia.url, bannerMedia.updatedAt)}
                    fill
                    priority
                    sizes="100vw"
                    className="object-contain"
                  />
                </div>
              )}

              {(mobileBannerMedia?.url || bannerMedia?.url) && (
                <div
                  className="relative block w-full overflow-hidden md:hidden"
                  style={{ aspectRatio: mobileBannerAspectRatio }}
                >
                  <Image
                    alt={mobileBannerMedia?.alt || bannerMedia?.alt || 'Banner'}
                    src={getMediaUrl(
                      (mobileBannerMedia || bannerMedia)!.url,
                      (mobileBannerMedia || bannerMedia)!.updatedAt,
                    )}
                    fill
                    priority
                    sizes="100vw"
                    className="object-contain"
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Breakpoint split must be CSS (md:), not JS state — otherwise SSR/first paint shows desktop on phones until hydration. */}
      <div className="md:hidden relative z-10">
        <header className="w-full shadow-sm" {...themeProps}>
          <div className="flex h-[61px] w-full items-center justify-between border-b border-border/60 bg-background px-4 supports-backdrop-filter:bg-background/90 supports-backdrop-filter:backdrop-blur-md">
            <div className="flex min-w-[88px] items-center gap-2">
              <button
                type="button"
                className="inline-flex h-10 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                aria-label="Mở menu"
                aria-expanded={mobileMenuOpen}
                aria-controls="header-mobile-drawer-nav"
                onClick={() => setMobileMenuOpen(true)}
              >
                <MenuIcon className="h-6 w-6" />
              </button>
              <Link
                href="/search"
                className="inline-flex h-10 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Tìm kiếm"
              >
                <SearchIcon className="h-5 w-5" />
              </Link>
            </div>
            <SmartLink
              href={logoHref}
              className="flex min-w-0 flex-1 items-center justify-center px-2"
            >
              {logo}
            </SmartLink>
            <div className="flex min-w-[88px] justify-end">{mobileAccountControl}</div>
          </div>
        </header>
      </div>

      <Dialog.Root open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <Dialog.Portal>
          <Dialog.Overlay
            className={cn(
              'fixed inset-0 z-100 bg-black/50',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
              'data-[state=open]:duration-300 data-[state=closed]:duration-200',
            )}
          />
          <Dialog.Content
            className={cn(
              'fixed inset-y-0 left-0 z-101 flex w-[min(100vw,20rem)] flex-col border-r border-border bg-background shadow-xl outline-none',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left',
              'data-[state=open]:duration-300 data-[state=closed]:duration-200',
            )}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <Dialog.Title className="text-lg font-semibold text-foreground">Menu</Dialog.Title>
              <Dialog.Close
                type="button"
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Đóng menu"
              >
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">
              Danh sách liên kết điều hướng trang
            </Dialog.Description>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <HeaderNav data={data} variant="drawer" onNavigate={() => setMobileMenuOpen(false)} />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={accountSheetOpen} onOpenChange={setAccountSheetOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-100 bg-black/50" />
          <Dialog.Content
            className={cn(
              'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-101 w-[min(100vw-2rem,360px)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background p-5 shadow-lg outline-none',
            )}
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <Dialog.Title className="text-lg font-semibold text-foreground">
                Tài khoản
              </Dialog.Title>
              <Dialog.Close
                type="button"
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer active:scale-95"
                aria-label="Đóng"
              >
                <X className="size-4" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">
              Thông tin tài khoản đang đăng nhập và đăng xuất
            </Dialog.Description>
            {user ? (
              <div className="flex flex-col gap-4">
                <div className="min-w-0">
                  <p
                    className="truncate text-base font-medium text-foreground"
                    title={user.email ?? ''}
                  >
                    {user.name?.trim() || user.email}
                  </p>
                  {user.name?.trim() ? (
                    <p
                      className="mt-1 truncate text-sm text-muted-foreground"
                      title={user.email ?? ''}
                    >
                      {user.email}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent cursor-pointer"
                  onClick={() => {
                    void logout()
                    setAccountSheetOpen(false)
                  }}
                >
                  Đăng xuất
                </button>
              </div>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="sticky top-0 z-50 w-full border-b border-border/60 bg-[#F1F1F1] shadow-sm md:hidden">
        <HeaderNav data={data} variant="mobile" />
      </div>

      <div className="w-full border-b border-border/60 bg-background px-2 py-2 md:hidden">
        <HeaderWeatherBar isMobile={true} />
      </div>

      {/* Top-level sticky block (banner is a sibling so this still spans the whole scroll) */}
      <div className="hidden relative z-10 md:block">
        <header className="sticky top-0 z-1 w-full shadow-sm" {...themeProps}>
          <div className="flex w-full items-center border-b border-border/60 bg-background px-4 py-2 supports-backdrop-filter:bg-background/90 supports-backdrop-filter:backdrop-blur-md">
            <div className="w-1/3 min-w-0 pr-2">
              <HeaderWeatherBar isMobile={false} />
            </div>
            <div className="flex flex-1 items-center justify-center">
              <SmartLink href={logoHref}>{logo}</SmartLink>
            </div>
            <div className="flex w-1/3 items-center justify-end gap-2">
              <Link href="/search">
                <div className="flex items-center rounded-full border border-border px-4 py-2">
                  <span className="mr-10 text-sm font-medium text-muted-foreground">Tìm kiếm</span>
                  <SearchIcon className="h-4 w-4 text-muted-foreground transition-colors hover:text-foreground" />
                </div>
              </Link>

              {accountControl}
            </div>
          </div>

          <div className="bg-[#F1F1F1]">
            <div className="container h-9 flex items-center justify-center">
              <HeaderNav data={data} />
            </div>
          </div>
        </header>
      </div>
    </>
  )
}

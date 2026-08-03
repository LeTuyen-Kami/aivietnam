import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import { isNativeHref, SmartLink } from '@/components/SmartLink'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import {
  Bird,
  CirclePlay,
  Cookie,
  FileText,
  Mail,
  Megaphone,
  Music2,
  Rss,
  ShieldCheck,
  Users,
} from 'lucide-react'
import NextImage from 'next/image'
import React from 'react'

import type { Footer as FooterType, Media as MediaType } from '@/payload-types'

import { cn } from '@/utilities/ui'

const accentClass = 'text-[#D32F2F] underline underline-offset-2'

type LinkField = NonNullable<
  NonNullable<FooterType['categoryColumns']>[number]['links']
>[number]['link']

function getFooterHref(link: LinkField): string | null {
  if (
    link.type === 'reference' &&
    typeof link.reference?.value === 'object' &&
    link.reference.value?.slug
  ) {
    const slug = link.reference.value?.slug
    return link.reference.relationTo !== 'pages'
      ? `/${link.reference.relationTo}/${slug}`
      : `/${slug}`
  }
  if (link.type === 'custom' && link.url?.trim()) {
    return link.url.trim()
  }
  return null
}

function FooterRichLink({ link, className }: { link: LinkField; className?: string }) {
  const url = link.url?.trim() ?? ''
  if (link.type === 'custom' && url && isNativeHref(url)) {
    return (
      <SmartLink className={cn('text-foreground hover:opacity-80', className)} href={url}>
        {link.label}
      </SmartLink>
    )
  }

  return (
    <CMSLink
      appearance="inline"
      className={cn('text-foreground hover:opacity-80', className)}
      {...link}
    />
  )
}

const contactIconClass = 'h-5 w-5 shrink-0 text-foreground'
const socialIconClass = 'h-4 w-4 shrink-0 text-foreground'

function ContactIcon({ icon }: { icon: NonNullable<FooterType['contactLinks']>[number]['icon'] }) {
  switch (icon) {
    case 'mail':
      return <Mail aria-hidden className={contactIconClass} strokeWidth={1.75} />
    case 'advertising':
      return <Megaphone aria-hidden className={contactIconClass} strokeWidth={1.75} />
    case 'terms':
      return <FileText aria-hidden className={contactIconClass} strokeWidth={1.75} />
    case 'privacy':
      return <ShieldCheck aria-hidden className={contactIconClass} strokeWidth={1.75} />
    case 'cookies':
      return <Cookie aria-hidden className={contactIconClass} strokeWidth={1.75} />
    default:
      return null
  }
}

function socialWrap(children: React.ReactNode, href: string | null | undefined, label: string) {
  const raw = href?.trim() ?? ''
  if (!raw) return null
  return (
    <SmartLink
      className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 text-foreground transition-colors hover:bg-neutral-100"
      href={raw}
    >
      <span className="sr-only">{label}</span>
      {children}
    </SmartLink>
  )
}

export async function Footer() {
  const data: FooterType = await getCachedGlobal('footer', 2)()

  const categoryColumns = data.categoryColumns?.filter((c) => (c.links?.length ?? 0) > 0) ?? []
  const categoriesHeading = data.categoriesHeading?.trim() || 'Chuyên mục'

  const appStoreBadge =
    typeof data.appStoreBadge === 'object' && data.appStoreBadge?.url
      ? (data.appStoreBadge as MediaType)
      : null
  const googlePlayBadge =
    typeof data.googlePlayBadge === 'object' && data.googlePlayBadge?.url
      ? (data.googlePlayBadge as MediaType)
      : null

  const featureImage =
    typeof data.featureImage === 'object' && data.featureImage?.url ? data.featureImage : null

  const phoneHref =
    data.centerPhoneHref?.trim() ||
    (data.centerPhone ? `tel:${data.centerPhone.replace(/\s/g, '')}` : '')
  const emailRaw = data.centerEmail?.trim() ?? ''
  const emailHref = emailRaw
    ? emailRaw.startsWith('mailto:')
      ? emailRaw
      : `mailto:${emailRaw}`
    : ''

  return (
    <footer className="mt-auto border-t border-neutral-200 bg-background text-foreground">
      {categoryColumns.length > 0 && (
        <div className="border-b border-neutral-200">
          <div className="container px-4 py-6 sm:px-6 sm:py-8 md:py-10">
            <h2 className="mb-4 text-base font-semibold text-foreground sm:mb-6 sm:text-lg md:text-xl">
              {categoriesHeading}
            </h2>
            <div className="grid grid-cols-1 gap-y-4 min-[380px]:grid-cols-2 min-[380px]:gap-x-4 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-3 lg:grid-cols-5">
              {categoryColumns.map((column, colIdx) => (
                <ul className="flex min-w-0 flex-col gap-2 text-sm" key={column.id ?? colIdx}>
                  {column.links?.map((row, i) =>
                    row.link ? (
                      <li key={row.id ?? i}>
                        <FooterRichLink link={row.link} />
                      </li>
                    ) : null,
                  )}
                </ul>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="container px-4 py-6 sm:px-6 sm:py-8 md:py-10">
        <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3 lg:items-start lg:gap-8">
          {/* Left */}
          <div className="flex min-w-0 flex-col gap-6 md:gap-8">
            {(data.appStoreUrl || data.googlePlayUrl || appStoreBadge || googlePlayBadge) && (
              <div>
                <p className="mb-3 text-sm font-semibold">
                  {data.downloadsTitle?.trim() || 'Tải ứng dụng'}
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {data.appStoreUrl?.trim() &&
                    (appStoreBadge ? (
                      <SmartLink
                        className="inline-block max-w-full shrink-0"
                        href={data.appStoreUrl.trim()}
                      >
                        <NextImage
                          alt="App Store"
                          className="h-9 w-auto max-w-full sm:h-10"
                          height={40}
                          src={getMediaUrl(appStoreBadge.url, appStoreBadge.updatedAt)}
                          width={120}
                        />
                      </SmartLink>
                    ) : (
                      <SmartLink
                        className={cn('text-sm font-medium', accentClass)}
                        href={data.appStoreUrl.trim()}
                      >
                        App Store
                      </SmartLink>
                    ))}
                  {data.googlePlayUrl?.trim() &&
                    (googlePlayBadge ? (
                      <SmartLink
                        className="inline-block max-w-full shrink-0"
                        href={data.googlePlayUrl.trim()}
                      >
                        <NextImage
                          alt="Google Play"
                          className="h-9 w-auto max-w-full sm:h-10"
                          height={40}
                          src={getMediaUrl(googlePlayBadge.url, googlePlayBadge.updatedAt)}
                          width={135}
                        />
                      </SmartLink>
                    ) : (
                      <SmartLink
                        className={cn('text-sm font-medium', accentClass)}
                        href={data.googlePlayUrl.trim()}
                      >
                        Google Play
                      </SmartLink>
                    ))}
                </div>
              </div>
            )}

            {(data.hotlines?.length ?? 0) > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">
                  {data.hotlineTitle?.trim() || 'Đường dây nóng'}
                </p>
                <ul className="flex flex-col gap-1.5 text-sm">
                  {data.hotlines?.map((h, i) => (
                    <li className="min-w-0 wrap-break-word" key={h.id ?? i}>
                      <span className="text-foreground">{h.label} </span>
                      <SmartLink
                        className={cn('text-sm break-all', accentClass)}
                        href={h.href.trim()}
                      >
                        {h.phone}
                      </SmartLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(data.contactLinks?.length ?? 0) > 0 && (
              <div>
                <p className="mb-3 text-sm font-semibold">
                  {data.contactLinksHeading?.trim() || 'Liên hệ'}
                </p>
                <ul className="flex flex-col gap-2">
                  {data.contactLinks?.map((row, i) => {
                    if (!row.link) return null
                    const href = getFooterHref(row.link)
                    if (!href) return null
                    return (
                      <li key={row.id ?? i}>
                        <SmartLink
                          className="flex min-w-0 items-center gap-2.5 rounded-lg bg-neutral-100 px-2.5 py-2.5 text-sm text-foreground transition-colors hover:bg-neutral-200/80 sm:gap-3 sm:px-3 dark:bg-neutral-800 dark:hover:bg-neutral-700/80"
                          href={href}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-200/80 sm:h-9 sm:w-9 dark:bg-neutral-700/80">
                            <ContactIcon icon={row.icon} />
                          </span>
                          <span className="min-w-0 flex-1 font-medium wrap-break-word">
                            {row.link.label}
                          </span>
                        </SmartLink>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Center */}
          <div className="flex min-w-0 w-full flex-col items-center gap-3 text-center sm:gap-4 lg:items-center">
            {featureImage && (
              <div className="relative hidden w-full max-w-md overflow-hidden rounded-lg lg:block">
                <Media
                  className="w-full"
                  imgClassName="h-auto w-full object-contain"
                  resource={featureImage}
                />
              </div>
            )}
            {data.brandTitle?.trim() && (
              <p
                className={cn(
                  'px-1 lg:text-base font-bold tracking-wide sm:text-lg whitespace-pre-line hidden lg:block',
                  'text-sm font-bold',
                )}
                dangerouslySetInnerHTML={{ __html: data.brandTitle.trim() }}
              ></p>
            )}
            {data.brandTagline?.trim() && (
              <p className="max-w-md px-1 text-sm text-muted-foreground sm:px-0 hidden lg:block">
                {data.brandTagline.trim()}
              </p>
            )}
            <div className="w-full max-w-md space-y-2.5 text-left text-sm leading-relaxed sm:space-y-3 lg:max-w-none">
              {data.contentResponsibility?.trim() && (
                <p className="wrap-break-word text-foreground">
                  {data.contentResponsibility.trim()}
                </p>
              )}
              {(data.headquartersAddress?.trim() || data.headquartersLabel?.trim()) && (
                <p className="wrap-break-word text-foreground">
                  {data.headquartersLabel?.trim() && (
                    <span className="font-semibold">{data.headquartersLabel.trim()} </span>
                  )}
                  {data.headquartersAddress?.trim()}
                </p>
              )}
              {data.centerPhone?.trim() && (
                <p className="wrap-break-word">
                  {data.phoneLabel?.trim() && (
                    <span className="font-semibold text-foreground">{data.phoneLabel.trim()} </span>
                  )}
                  {phoneHref ? (
                    <SmartLink className={cn(accentClass, 'break-all text-sm')} href={phoneHref}>
                      {data.centerPhone.trim()}
                    </SmartLink>
                  ) : (
                    <span className={cn(accentClass, 'break-all')}>{data.centerPhone.trim()}</span>
                  )}
                </p>
              )}
              {emailRaw && (
                <p className="wrap-break-word">
                  {data.emailLabel?.trim() && (
                    <span className="font-semibold text-foreground">{data.emailLabel.trim()} </span>
                  )}
                  <SmartLink className={cn(accentClass, 'break-all text-sm')} href={emailHref}>
                    {emailRaw}
                  </SmartLink>
                </p>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="flex min-w-0 flex-col gap-5 sm:gap-6">
            {(data.socialFacebook ||
              data.socialX ||
              data.socialYoutube ||
              data.socialTiktok ||
              data.socialRss) && (
              <div>
                <p className="mb-3 text-sm font-semibold">
                  {data.socialHeading?.trim() || 'Theo dõi AI Việt Nam trên'}
                </p>
                <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                  {socialWrap(
                    <Users aria-hidden className={socialIconClass} strokeWidth={1.75} />,
                    data.socialFacebook,
                    'Facebook',
                  )}
                  {socialWrap(
                    <Bird aria-hidden className={socialIconClass} strokeWidth={1.75} />,
                    data.socialX,
                    'X',
                  )}
                  {socialWrap(
                    <CirclePlay aria-hidden className={socialIconClass} strokeWidth={1.75} />,
                    data.socialYoutube,
                    'YouTube',
                  )}
                  {socialWrap(
                    <Music2 aria-hidden className={socialIconClass} strokeWidth={1.75} />,
                    data.socialTiktok,
                    'TikTok',
                  )}
                  {socialWrap(
                    <Rss aria-hidden className={socialIconClass} strokeWidth={1.75} />,
                    data.socialRss,
                    'RSS',
                  )}
                </div>
              </div>
            )}

            {featureImage && (
              <div className="relative w-full max-w-md overflow-hidden rounded-lg lg:hidden">
                <Media
                  className="w-full"
                  imgClassName="h-auto w-full object-contain"
                  resource={featureImage}
                />
              </div>
            )}

            <div className="block lg:hidden space-y-2">
              {data.brandTitle?.trim() && (
                <p
                  className={cn(
                    'px-1 lg:text-base font-bold tracking-wide sm:text-lg whitespace-pre-line block lg:hidden text-center leading-6! [&_span]:text-sm',
                  )}
                  dangerouslySetInnerHTML={{ __html: data.brandTitle.trim() }}
                ></p>
              )}
              {data.brandTagline?.trim() && (
                <p className="max-w-md px-1 text-sm text-muted-foreground sm:px-0 block lg:hidden text-center">
                  {data.brandTagline.trim()}
                </p>
              )}
            </div>

            {(data.promoTitle?.trim() || data.promoSubtitle?.trim()) && (
              <div className="hidden lg:block">
                {data.promoHref?.trim() ? (
                  <SmartLink
                    className="block rounded border border-neutral-300 p-3 text-center transition-colors hover:bg-neutral-50 sm:p-4 dark:hover:bg-neutral-900/40"
                    href={data.promoHref.trim()}
                  >
                    {data.promoTitle?.trim() && (
                      <p className="text-sm font-bold uppercase leading-snug">
                        {data.promoTitle.trim()}
                      </p>
                    )}
                    {data.promoSubtitle?.trim() && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {data.promoSubtitle.trim()}
                      </p>
                    )}
                  </SmartLink>
                ) : (
                  <div className="rounded border border-neutral-300 p-3 text-center sm:p-4">
                    {data.promoTitle?.trim() && (
                      <p className="text-sm font-bold uppercase leading-snug">
                        {data.promoTitle.trim()}
                      </p>
                    )}
                    {data.promoSubtitle?.trim() && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {data.promoSubtitle.trim()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2 text-xs leading-relaxed wrap-break-word text-muted-foreground">
              {data.licenseLine?.trim() && <p>{data.licenseLine.trim()}</p>}
              {data.copyrightLine?.trim() && <p>{data.copyrightLine.trim()}</p>}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

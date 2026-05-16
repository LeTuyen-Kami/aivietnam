import { getCachedGlobal } from '@/utilities/getGlobals'
import { HeaderClient } from './Component.client'

import type { GeneralSetting, Header, Media } from '@/payload-types'

export async function Header() {
  const [headerData, generalSettings]: [Header, GeneralSetting] = await Promise.all([
    getCachedGlobal('header', 1)(),
    getCachedGlobal('general-settings', 1)(),
  ])

  const bannerMedia =
    typeof headerData?.bannerImage === 'object' ? (headerData.bannerImage as Media) : null
  const mobileBannerMedia =
    typeof headerData?.mobileBannerImage === 'object'
      ? (headerData.mobileBannerImage as Media)
      : null
  const bannerWidth = bannerMedia?.width ?? null
  const bannerHeight = bannerMedia?.height ?? null
  const mobileBannerWidth = mobileBannerMedia?.width ?? null
  const mobileBannerHeight = mobileBannerMedia?.height ?? null

  return (
    <HeaderClient
      data={headerData}
      generalSettings={generalSettings}
      bannerWidth={bannerWidth}
      bannerHeight={bannerHeight}
      mobileBannerWidth={mobileBannerWidth}
      mobileBannerHeight={mobileBannerHeight}
    />
  )
}

import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'

import type { GeneralSetting, Header } from '@/payload-types'

export async function Header() {
  const [headerData, generalSettings]: [Header, GeneralSetting] = await Promise.all([
    getCachedGlobal('header', 1)(),
    getCachedGlobal('general-settings', 1)(),
  ])

  return <HeaderClient data={headerData} generalSettings={generalSettings} />
}

import type { GeneralSetting } from '@/payload-types'

import { getCachedGlobal } from '@/utilities/getGlobals'

const FALLBACK_SITE_LABEL = 'Website'

export function siteLabelFromGeneralSettings(gs: GeneralSetting | null | undefined): string {
  return gs?.siteName?.trim() || FALLBACK_SITE_LABEL
}

export async function getGeneralSettingsCached(depth = 0): Promise<GeneralSetting> {
  return (await getCachedGlobal('general-settings', depth)()) as GeneralSetting
}

export async function getSiteLabelForMetadata(): Promise<string> {
  const gs = await getGeneralSettingsCached(0)
  return siteLabelFromGeneralSettings(gs)
}

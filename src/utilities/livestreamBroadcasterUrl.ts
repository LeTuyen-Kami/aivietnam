import { getServerSideURL } from '@/utilities/getURL'

export function getLivestreamBroadcasterPath(slug: string | null | undefined): string | null {
  if (slug == null || String(slug).trim() === '') return null
  return `/broadcaster/${encodeURIComponent(String(slug).trim())}`
}

export function getLivestreamBroadcasterUrl(slug: string | null | undefined): string | null {
  const path = getLivestreamBroadcasterPath(slug)
  if (path == null) return null
  const base = getServerSideURL().replace(/\/$/, '')
  return `${base}${path}`
}

export const getLivestreamBroadcasterAbsoluteUrl = getLivestreamBroadcasterUrl

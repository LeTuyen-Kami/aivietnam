import { getServerSideURL } from '@/utilities/getURL'

/**
 * Public viewer path for a livestream slug. Phase 5 will serve this route.
 */
export function getLivestreamViewerPath(slug: string | null | undefined): string | null {
  if (slug == null || String(slug).trim() === '') return null
  return `/live/${encodeURIComponent(String(slug).trim())}`
}

/**
 * Absolute URL for opening/copying the public viewer link from Payload Admin.
 */
export function getLivestreamViewerAbsoluteUrl(slug: string | null | undefined): string | null {
  const path = getLivestreamViewerPath(slug)
  if (path == null) return null
  const base = getServerSideURL().replace(/\/$/, '')
  return `${base}${path}`
}

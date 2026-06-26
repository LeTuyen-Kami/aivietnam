import { getServerSideURL } from './getURL'

/**
 * Processes media resource URL to ensure proper formatting.
 * Same-origin paths are always returned as relative URLs so SSR and the browser
 * produce identical markup (avoids hydration mismatch from env-dependent absolute URLs).
 * External CDN URLs are kept absolute.
 */
export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
  if (!url) return ''

  if (cacheTag && cacheTag !== '') {
    cacheTag = encodeURIComponent(cacheTag)
  }

  let path: string

  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url)
      const baseParsed = new URL(getServerSideURL())
      const sameOrigin =
        parsed.protocol === baseParsed.protocol &&
        parsed.hostname === baseParsed.hostname &&
        parsed.port === baseParsed.port

      if (!sameOrigin) {
        return cacheTag ? `${url}?${cacheTag}` : url
      }

      path = `${parsed.pathname}${parsed.search}`
    } catch {
      return cacheTag ? `${url}?${cacheTag}` : url
    }
  } else {
    path = url.startsWith('/') ? url : `/${url}`
  }

  return cacheTag ? `${path}?${cacheTag}` : path
}

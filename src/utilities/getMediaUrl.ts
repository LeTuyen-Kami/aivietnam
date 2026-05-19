import { getServerSideURL } from './getURL'

/**
 * Processes media resource URL to ensure proper formatting.
 * Relative paths are resolved with NEXT_PUBLIC_SERVER_URL so SSR and the browser
 * produce the same absolute URL (avoids hydration mismatch from HOSTNAME / window).
 */
export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
  if (!url) return ''

  if (cacheTag && cacheTag !== '') {
    cacheTag = encodeURIComponent(cacheTag)
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return cacheTag ? `${url}?${cacheTag}` : url
  }

  const baseUrl = getServerSideURL().replace(/\/$/, '')
  const path = url.startsWith('/') ? url : `/${url}`
  const absoluteUrl = `${baseUrl}${path}`
  const _url = process?.env?.NEXT_PUBLIC_ENV === 'dev' ? absoluteUrl : path

  return cacheTag ? `${_url}?${cacheTag}` : _url
}

// docker stop aivietnam
// docker rm aivietnam

// docker rm aivietnam 2>/dev/null || true

// docker run -d --name aivietnam --env-file /var/www/aivietnam/.env -p 3000:3000 --pull always ghcr.io/letuyen-kami/aivietnam:latest

// docker stop aivietnam
// docker rm aivietnam
// docker run -d \
//   --name aivietnam \
//   --env-file /var/www/aivietnam/.env \
//   -p 3000:3000 \
//   --pull always \
//   ghcr.io/letuyen-kami/aivietnam:latest

/**
 * Processes media resource URL to ensure proper formatting
 * @param url The original URL from the resource
 * @param cacheTag Optional cache tag to append to the URL
 * @returns Properly formatted URL with cache tag if provided
 */
export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
  if (!url) return ''

  if (cacheTag && cacheTag !== '') {
    cacheTag = encodeURIComponent(cacheTag)
  }

  // Check if URL already has http/https protocol
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return cacheTag ? `${url}?${cacheTag}` : url
  }

  // Otherwise prepend client-side URL
  // const baseUrl = getClientSideURL()
  // return cacheTag ? `${baseUrl}${url}?${cacheTag}` : `${baseUrl}${url}`
  return cacheTag ? `${url}?${cacheTag}` : `${url}`
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

const CHAT_CHANNEL_TYPE = 'livestream'

export function streamChatChannelType(): string {
  return CHAT_CHANNEL_TYPE
}

export function streamChatChannelIdFromSlug(slug: string): string {
  return slug.trim().toLowerCase()
}

export function streamChatChannelCidFromSlug(slug: string): string {
  return `${CHAT_CHANNEL_TYPE}:${streamChatChannelIdFromSlug(slug)}`
}

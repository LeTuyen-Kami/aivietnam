const PUBLIC_STREAM_API_KEY_ENV = 'NEXT_PUBLIC_STREAM_API_KEY'

const STREAM_API_KEY_SETUP_MESSAGE =
  'Broadcaster setup incomplete: set NEXT_PUBLIC_STREAM_API_KEY to your Stream public API key (usually the same value as STREAM_API_KEY).'

export type PublicStreamEnvStatus = {
  apiKey: string
  isConfigured: boolean
  setupMessage: string
}

export function getPublicStreamEnvStatus(): PublicStreamEnvStatus {
  const apiKey = (process.env.NEXT_PUBLIC_STREAM_API_KEY ?? '').trim()

  return {
    apiKey,
    isConfigured: apiKey.length > 0,
    setupMessage: STREAM_API_KEY_SETUP_MESSAGE,
  }
}

export function getPublicStreamApiKey(): string {
  return getPublicStreamEnvStatus().apiKey
}

export function getPublicStreamApiKeyEnvName(): string {
  return PUBLIC_STREAM_API_KEY_ENV
}

export function getPublicStreamSetupMessage(): string {
  return STREAM_API_KEY_SETUP_MESSAGE
}

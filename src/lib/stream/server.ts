import 'server-only'

import { StreamClient } from '@stream-io/node-sdk'

let client: StreamClient | undefined

function requireStreamEnv(): { apiKey: string; apiSecret: string } {
  const apiKey = process.env.STREAM_API_KEY
  const apiSecret = process.env.STREAM_API_SECRET
  if (!apiKey || !apiSecret) {
    throw new Error(
      'STREAM_API_KEY and STREAM_API_SECRET must be set — add Stream credentials from the GetStream dashboard.',
    )
  }
  return { apiKey, apiSecret }
}

export function getStreamServerClient(): StreamClient {
  if (!client) {
    const { apiKey, apiSecret } = requireStreamEnv()
    client = new StreamClient(apiKey, apiSecret)
  }
  return client
}

import crypto from 'node:crypto'

function webhookSigningSecret(): string {
  const explicit = (process.env.STREAM_CHAT_WEBHOOK_SECRET ?? '').trim()
  if (explicit) return explicit

  const fallback = (process.env.STREAM_CHAT_API_SECRET ?? '').trim()
  if (fallback) return fallback

  throw new Error('STREAM_CHAT_WEBHOOK_SECRET (or STREAM_CHAT_API_SECRET fallback) is required.')
}

export function verifyStreamChatWebhookSignature(params: {
  signature: string | null
  rawBody: string
}): boolean {
  if (!params.signature) return false
  const expected = crypto.createHmac('sha256', webhookSigningSecret()).update(params.rawBody).digest('hex')
  if (params.signature.length !== expected.length) return false
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(params.signature))
}

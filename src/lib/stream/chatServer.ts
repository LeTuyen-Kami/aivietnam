import 'server-only'

import { StreamChat } from 'stream-chat'

import { streamChatChannelIdFromSlug, streamChatChannelType } from './chatChannel'

let chatClient: StreamChat | undefined

type StreamChatEnv = {
  apiKey: string
  apiSecret: string
}

function requiredEnvValue(name: 'STREAM_CHAT_API_KEY' | 'STREAM_CHAT_API_SECRET'): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`${name} must be set for Stream Chat integration.`)
  }
  return value
}

export function requireStreamChatEnv(): StreamChatEnv {
  return {
    apiKey: requiredEnvValue('STREAM_CHAT_API_KEY'),
    apiSecret: requiredEnvValue('STREAM_CHAT_API_SECRET'),
  }
}

export function isStreamChatEnabled(): boolean {
  return (process.env.STREAM_CHAT_ENABLED ?? '').trim().toLowerCase() === 'true'
}

export function getStreamChatServerClient(): StreamChat {
  if (!chatClient) {
    const { apiKey, apiSecret } = requireStreamChatEnv()
    chatClient = StreamChat.getInstance(apiKey, apiSecret)
  }
  return chatClient
}

export async function ensureLivestreamChatChannel(params: {
  slug: string
  createdById: string
  name?: string
}): Promise<{ channelType: string; channelId: string; channelCid: string }> {
  const client = getStreamChatServerClient()
  const channelType = streamChatChannelType()
  const channelId = streamChatChannelIdFromSlug(params.slug)
  const channel = client.channel(channelType, channelId, {
    created_by_id: params.createdById,
  })
  try {
    await channel.create()
  } catch (error) {
    const statusCode = (error as { status?: number }).status
    if (statusCode !== 4 && statusCode !== 409) {
      throw error
    }
  }

  return {
    channelType,
    channelId,
    channelCid: `${channelType}:${channelId}`,
  }
}

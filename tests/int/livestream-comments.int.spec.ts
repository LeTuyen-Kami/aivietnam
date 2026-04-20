import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const commentsRoutePath = path.resolve(
  process.cwd(),
  'src/app/(frontend)/api/stream/chat-token/route.ts',
)
const likeRoutePath = path.resolve(
  process.cwd(),
  'src/app/(frontend)/api/stream/chat-webhook/route.ts',
)
const viewerClientPath = path.resolve(process.cwd(), 'src/app/(frontend)/live/[slug]/Viewer.client.tsx')
const engagementPath = path.resolve(
  process.cwd(),
  'src/app/(frontend)/live/[slug]/LiveViewerEngagement.client.tsx',
)

describe('livestream comments and hearts contract', () => {
  it('exposes auth-gated chat token route and access-safe livestream lookup', async () => {
    const content = await readFile(commentsRoutePath, 'utf8')

    expect(content).toContain('export async function POST')
    expect(content).toContain("collection: 'livestreams'")
    expect(content).toContain('slug')
    expect(content).toContain('Stream chat is disabled')
    expect(content).toContain('overrideAccess: false')
    expect(content).toContain('Unauthorized')
  })

  it('verifies webhook signature and persists idempotent receipts', async () => {
    const content = await readFile(likeRoutePath, 'utf8')

    expect(content).toContain('verifyStreamChatWebhookSignature')
    expect(content).toContain("collection: 'livestream-chat-event-receipts'")
    expect(content).toContain("collection: 'livestream-chat-messages'")
    expect(content).toContain('duplicate: true')
  })

  it('wires viewer engagement to Stream Chat without modifying stream video join contract', async () => {
    const viewerContent = await readFile(viewerClientPath, 'utf8')
    const engagementContent = await readFile(engagementPath, 'utf8')

    expect(viewerContent).toContain('LiveViewerEngagement')
    expect(viewerContent).toContain('join({ create: false })')
    expect(engagementContent).toContain('/api/stream/chat-token')
    expect(engagementContent).toContain('channel.sendMessage')
    expect(engagementContent).toContain('channel.sendReaction')
  })
})

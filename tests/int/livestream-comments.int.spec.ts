import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const commentsRoutePath = path.resolve(
  process.cwd(),
  'src/app/(frontend)/api/livestream-comments/route.ts',
)
const likeRoutePath = path.resolve(
  process.cwd(),
  'src/app/(frontend)/api/livestream-comments/like/route.ts',
)
const viewerClientPath = path.resolve(process.cwd(), 'src/app/(frontend)/live/[slug]/Viewer.client.tsx')
const engagementPath = path.resolve(
  process.cwd(),
  'src/app/(frontend)/live/[slug]/LiveViewerEngagement.client.tsx',
)

describe('livestream comments and hearts contract', () => {
  it('exposes slug-scoped list/create route with auth and access-safe livestream lookup', async () => {
    const content = await readFile(commentsRoutePath, 'utf8')

    expect(content).toContain('export async function GET')
    expect(content).toContain('export async function POST')
    expect(content).toContain("collection: 'livestreams'")
    expect(content).toContain('slug')
    expect(content).toContain('overrideAccess: false')
    expect(content).toContain('Unauthorized')
  })

  it('provides like-toggle contract with deterministic liked and likeCount response', async () => {
    const content = await readFile(likeRoutePath, 'utf8')

    expect(content).toContain("collection: 'livestream-comment-likes'")
    expect(content).toContain('liked:')
    expect(content).toContain('likeCount:')
    expect(content).toContain('overrideAccess: false')
  })

  it('wires viewer engagement component without modifying stream join contract', async () => {
    const viewerContent = await readFile(viewerClientPath, 'utf8')
    const engagementContent = await readFile(engagementPath, 'utf8')

    expect(viewerContent).toContain('LiveViewerEngagement')
    expect(viewerContent).toContain('join({ create: false })')
    expect(engagementContent).toContain('/api/livestream-comments')
    expect(engagementContent).toContain('/api/livestream-comments/like')
    expect(engagementContent).toContain('refetchInterval: 3000')
  })
})

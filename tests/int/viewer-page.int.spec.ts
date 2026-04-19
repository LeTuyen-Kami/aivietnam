import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const pagePath = path.resolve(process.cwd(), 'src/app/(frontend)/live/[slug]/page.tsx')

describe('viewer page guard contract', () => {
  it('redirects unauthenticated users through login-required return flow', async () => {
    const content = await readFile(pagePath, 'utf8')

    expect(content).toContain('auth=login_required')
    expect(content).toContain('returnTo')
    expect(content).toContain('/live/${encodedSlug}')
  })

  it('enforces access-safe slug lookup via payload local api', async () => {
    const content = await readFile(pagePath, 'utf8')

    expect(content).toContain("collection: 'livestreams'")
    expect(content).toContain('slug: {')
    expect(content).toContain('equals: decodedSlug')
    expect(content).toContain('user')
    expect(content).toContain('overrideAccess: false')
  })
})

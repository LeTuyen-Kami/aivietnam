import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const pagePath = path.resolve(
  process.cwd(),
  'src/app/(frontend)/broadcaster/[slug]/page.tsx',
)

describe('broadcaster page guard contract', () => {
  it('defines server-side slug lookup, access gating, and env preflight wiring', async () => {
    const content = await readFile(pagePath, 'utf8')

    expect(content).toContain('/?auth=login_required')
    expect(content).toContain('slug: {')
    expect(content).toContain('equals: decodedSlug')
    expect(content).toContain('Access denied')
    expect(content).toContain('getPublicStreamEnvStatus')
    expect(content).toContain('streamApiKey={streamEnv.apiKey}')
    expect(content).toContain('streamSetupMessage={streamEnv.isConfigured ? null : streamEnv.setupMessage}')
  })
})

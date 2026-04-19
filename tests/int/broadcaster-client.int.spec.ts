import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const clientPath = path.resolve(
  process.cwd(),
  'src/app/(frontend)/broadcaster/[slug]/Broadcaster.client.tsx',
)

describe('broadcaster client lifecycle contract', () => {
  it('wires token provider and lifecycle endpoints', async () => {
    const content = await readFile(clientPath, 'utf8')

    expect(content).toContain('tokenProvider')
    expect(content).toContain('/api/stream/broadcaster-token')
    expect(content).toMatch(/\/api\/livestreams\/\$\{.*\}\/start/)
    expect(content).toMatch(/\/api\/livestreams\/\$\{.*\}\/end/)
    expect(content).toContain('Start livestream')
    expect(content).toContain('End livestream')
  })
})

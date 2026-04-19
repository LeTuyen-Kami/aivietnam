import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const pagePath = path.resolve(
  process.cwd(),
  'src/app/(frontend)/broadcaster/[slug]/page.tsx',
)

describe('broadcaster page guard contract', () => {
  it('defines server-side slug lookup and access gating', async () => {
    const content = await readFile(pagePath, 'utf8')

    expect(content).toContain('/?auth=login_required')
    expect(content).toContain('slug: {')
    expect(content).toContain('equals: decodedSlug')
    expect(content).toContain('Access denied')
  })
})

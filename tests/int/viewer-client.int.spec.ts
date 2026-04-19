import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const clientPath = path.resolve(process.cwd(), 'src/app/(frontend)/live/[slug]/Viewer.client.tsx')

describe('viewer client lifecycle contract', () => {
  it('uses stream tokenProvider contract and handles auth-expiry redirect', async () => {
    const content = await readFile(clientPath, 'utf8')

    expect(content).toContain('tokenProvider')
    expect(content).toContain('/api/stream/token')
    expect(content).toMatch(/401|Unauthorized/)
    expect(content).toContain('auth=login_required')
    expect(content).toContain('returnTo')
  })

  it('joins only when livestream status is live and cleans up stream resources', async () => {
    const content = await readFile(clientPath, 'utf8')

    expect(content).toMatch(/status\s*===\s*'live'|isLiveStatus/)
    expect(content).toContain('join({ create: false })')
    expect(content).toMatch(/leave\(\)|disconnectUser\(\)/)
  })

  it('renders scheduled and ended state placeholders with contract copy', async () => {
    const content = await readFile(clientPath, 'utf8')

    expect(content).toContain('Livestream chưa bắt đầu')
    expect(content).toContain('Livestream đã kết thúc')
    expect(content).toContain('Đang kết nối lại livestream')
    expect(content).toMatch(/scheduled|live|ended/)
  })
})

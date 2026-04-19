import { describe, expect, it } from 'vitest'

import type { User } from '@/payload-types'
import { streamUserIdFromPayloadUser } from '@/lib/stream/user'

describe('streamUserIdFromPayloadUser (STRM-03)', () => {
  it('stringifies numeric id', () => {
    expect(streamUserIdFromPayloadUser({ id: 42 } as User)).toBe('42')
  })

  it('stringifies string id if ever present', () => {
    expect(streamUserIdFromPayloadUser({ id: 'abc' } as unknown as User)).toBe('abc')
  })
})

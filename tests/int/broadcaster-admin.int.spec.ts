import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMock = vi.fn()
const upsertUsersMock = vi.fn()
const generateUserTokenMock = vi.fn()

vi.mock('payload', async (importOriginal) => {
  const actual = await importOriginal<typeof import('payload')>()
  return {
    ...actual,
    getPayload: vi.fn(async () => ({
      auth: authMock,
    })),
  }
})

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers()),
}))

vi.mock('@/lib/stream/server', () => ({
  getStreamServerClient: vi.fn(() => ({
    upsertUsers: upsertUsersMock,
    generateUserToken: generateUserTokenMock,
  })),
}))

describe('broadcaster admin token API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STREAM_TOKEN_VALIDITY_SECONDS = '60'
  })

  it('returns 401 for unauthenticated callers', async () => {
    authMock.mockResolvedValueOnce({ user: null })
    const route = await import('@/app/(frontend)/api/stream/broadcaster-token/route')
    const res = await route.POST({} as never)
    expect(res.status).toBe(401)
  }, 20000)

  it('returns 403 for authenticated non-admin users', async () => {
    authMock.mockResolvedValueOnce({
      user: { collection: 'users', roles: ['user'], id: 123, email: 'user@example.com' },
    })
    const route = await import('@/app/(frontend)/api/stream/broadcaster-token/route')
    const res = await route.POST({} as never)
    expect(res.status).toBe(403)
  }, 20000)

  it('returns token metadata for admin users', async () => {
    generateUserTokenMock.mockReturnValueOnce('token-123')
    authMock.mockResolvedValueOnce({
      user: { collection: 'users', roles: ['admin'], id: 99, email: 'admin@example.com' },
    })

    const route = await import('@/app/(frontend)/api/stream/broadcaster-token/route')
    const res = await route.POST({} as never)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(upsertUsersMock).toHaveBeenCalledTimes(1)
    expect(body.token).toBe('token-123')
    expect(body.expiresAt).toBeTypeOf('string')
  }, 20000)
})

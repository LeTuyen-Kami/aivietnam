import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMock = vi.fn()
const findByIdMock = vi.fn()
const updateMock = vi.fn()
const getOrCreateMock = vi.fn()
const queryMembersMock = vi.fn()
const updateCallMembersMock = vi.fn()
const generateCallTokenMock = vi.fn()

vi.mock('payload', async (importOriginal) => {
  const actual = await importOriginal<typeof import('payload')>()
  return {
    ...actual,
    getPayload: vi.fn(async () => ({
      auth: authMock,
      findByID: findByIdMock,
      update: updateMock,
    })),
  }
})

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => new Headers()),
}))

vi.mock('@/lib/stream/server', () => ({
  getStreamServerClient: vi.fn(() => ({
    video: {
      call: () => ({
        getOrCreate: getOrCreateMock,
        queryMembers: queryMembersMock,
        updateCallMembers: updateCallMembersMock,
      }),
    },
    generateCallToken: generateCallTokenMock,
  })),
}))

describe('livestream lifecycle APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { id: 1, collection: 'users', roles: ['admin'] } })
  })

  it('marks livestream live only after publisher join confirmation', async () => {
    findByIdMock.mockResolvedValueOnce({ id: 10, callType: 'livestream', callId: '' })
    queryMembersMock.mockResolvedValueOnce({ members: [{ user_id: '1' }] })
    updateMock.mockResolvedValueOnce({ id: 10, status: 'live' })
    generateCallTokenMock.mockReturnValueOnce('call-token')

    const route = await import('@/app/(frontend)/api/livestreams/[id]/start/route')
    const res = await route.POST({} as never, { params: Promise.resolve({ id: '10' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('live')
    expect(body.publisherJoinConfirmed).toBe(true)
  }, 20000)

  it('allows moderator to start a livestream', async () => {
    authMock.mockResolvedValueOnce({
      user: { id: 2, collection: 'users', roles: ['moderator'] },
    })
    findByIdMock.mockResolvedValueOnce({ id: 11, callType: 'livestream', callId: 'room-11' })
    queryMembersMock.mockResolvedValueOnce({ members: [{ user_id: '2' }] })
    updateMock.mockResolvedValueOnce({ id: 11, status: 'live' })
    generateCallTokenMock.mockReturnValueOnce('mod-call-token')

    const route = await import('@/app/(frontend)/api/livestreams/[id]/start/route')
    const res = await route.POST({} as never, { params: Promise.resolve({ id: '11' }) })

    expect(res.status).toBe(200)
  }, 20000)

  it('sets livestream status to ended for admin end request', async () => {
    updateMock.mockResolvedValueOnce({ id: 10, status: 'ended' })
    const route = await import('@/app/(frontend)/api/livestreams/[id]/end/route')
    const res = await route.POST({} as never, { params: Promise.resolve({ id: '10' }) })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('ended')
  }, 20000)
})

# Phase 5: Public viewer - Pattern Map

**Mapped:** 2026-04-20  
**Files analyzed:** 6  
**Analogs found:** 6 / 6

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/app/(frontend)/live/[slug]/page.tsx` | route | request-response | `src/app/(frontend)/broadcaster/[slug]/page.tsx` | exact |
| `src/app/(frontend)/live/[slug]/Viewer.client.tsx` | component | streaming | `src/app/(frontend)/broadcaster/[slug]/Broadcaster.client.tsx` | exact |
| `src/app/(frontend)/api/livestreams/[slug]/status/route.ts` | route | CRUD | `src/app/(frontend)/api/livestreams/[id]/start/route.ts` | role-match |
| `tests/int/viewer-page.int.spec.ts` | test | request-response | `tests/int/broadcaster-page.int.spec.ts` | exact |
| `tests/int/viewer-client.int.spec.ts` | test | streaming | `tests/int/broadcaster-client.int.spec.ts` | exact |
| `tests/e2e/viewer.e2e.spec.ts` | test | request-response | `tests/e2e/broadcaster.e2e.spec.ts` | exact |

## Pattern Assignments

### `src/app/(frontend)/live/[slug]/page.tsx` (route, request-response)

**Analog:** `src/app/(frontend)/broadcaster/[slug]/page.tsx`

**Imports + server auth gate pattern** (lines 1-7, 21-25):
```typescript
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
// ...
const { user } = await payload.auth({ headers: await headers() })

if (!user) {
  redirect(`/?auth=login_required&returnTo=${encodeURIComponent(`/broadcaster/${decodedSlug}`)}`)
}
```

**Local API access-safe lookup by slug** (lines 40-49):
```typescript
const result = await payload.find({
  collection: 'livestreams',
  depth: 0,
  limit: 1,
  pagination: false,
  overrideAccess: false,
  user,
  where: {
    slug: { equals: decodedSlug },
  },
})
```

**Not-found + client handoff pattern** (lines 52-67):
```typescript
const livestream = result.docs[0] as Livestream | undefined
if (!livestream) notFound()
const streamEnv = getPublicStreamEnvStatus()

return (
  <BroadcasterClient
    livestream={livestream}
    streamApiKey={streamEnv.apiKey}
    streamSetupMessage={streamEnv.isConfigured ? null : streamEnv.setupMessage}
    streamUser={{ id: String(user.id), name: user.email }}
  />
)
```

---

### `src/app/(frontend)/live/[slug]/Viewer.client.tsx` (component, streaming)

**Analog:** `src/app/(frontend)/broadcaster/[slug]/Broadcaster.client.tsx`

**SDK imports + call primitives** (lines 3-11):
```typescript
import {
  LivestreamLayout,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  type Call,
} from '@stream-io/video-react-sdk'
import '@stream-io/video-react-sdk/dist/css/styles.css'
```

**tokenProvider fetch pattern** (lines 58-70):
```typescript
const tokenProvider = useCallback(async () => {
  const response = await fetch('/api/stream/broadcaster-token', {
    method: 'POST',
    credentials: 'include',
  })
  const body = (await response.json().catch(() => ({}))) as { token?: string; error?: string }
  if (!response.ok || !body.token) {
    throw new Error(body.error ?? 'Unable to fetch broadcaster token')
  }
  return body.token
}, [])
```

**Live-only setup + cleanup lifecycle** (lines 74-122):
```typescript
useEffect(() => {
  if (!hasStreamingConfig || !isLiveStatus(callState.status)) return

  let mounted = true
  let activeCall: Call | null = null
  let activeClient: StreamVideoClient | null = null

  const setup = async () => {
    const nextClient = new StreamVideoClient({ apiKey, user: { ...streamUser, type: 'authenticated' }, tokenProvider })
    const nextCall = nextClient.call(callState.callType, callState.callId)
    await nextCall.join({ create: false })
    // ...
  }

  return () => {
    mounted = false
    setCall(null)
    setClient(null)
    if (activeCall) void activeCall.leave().catch(() => null)
    if (activeClient) void activeClient.disconnectUser().catch(() => null)
  }
}, [apiKey, callState.callId, callState.callType, callState.status, hasStreamingConfig, streamUser, tokenProvider])
```

**Render switch for player vs placeholder** (lines 219-232):
```tsx
{client && call && isLiveStatus(callState.status) ? (
  <StreamVideo client={client}>
    <StreamCall call={call}>
      <LivestreamLayout />
    </StreamCall>
  </StreamVideo>
) : (
  <div className="rounded border border-dashed border-border p-6 text-sm text-muted-foreground">
    Livestream is ready to start.
  </div>
)}
```

---

### `src/app/(frontend)/api/livestreams/[slug]/status/route.ts` (route, CRUD)

**Analog:** `src/app/(frontend)/api/livestreams/[id]/start/route.ts`

**Route params + validation pattern** (lines 15-20):
```typescript
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const livestreamId = Number(id)
  if (!livestreamId || Number.isNaN(livestreamId)) {
    return NextResponse.json({ error: 'Invalid livestream id' }, { status: 400 })
  }
}
```

**Auth + role gate pattern** (lines 22-27):
```typescript
const payload = await getPayload({ config })
const requestHeaders = await headers()
const { user } = await payload.auth({ headers: requestHeaders })
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
if (!isUsersCollectionAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
```

**Access-safe doc read/write pattern** (lines 28-34, 84-95):
```typescript
const livestream = await payload.findByID({
  collection: 'livestreams',
  id: livestreamId,
  user,
  overrideAccess: false,
  depth: 0,
})

const liveDoc = await payload.update({
  collection: 'livestreams',
  id: livestreamId,
  data: { status: 'live' },
  user,
  overrideAccess: false,
  depth: 0,
})
```

For slug-based status route, copy the same request/response shape but swap `findByID` for `find({ where: { slug: { equals: decodedSlug }}})` with `limit: 1`.

---

### `tests/int/viewer-page.int.spec.ts` (test, request-response)

**Analog:** `tests/int/broadcaster-page.int.spec.ts`

**File-contract assertion pattern** (lines 6-23):
```typescript
const pagePath = path.resolve(process.cwd(), 'src/app/(frontend)/broadcaster/[slug]/page.tsx')

describe('broadcaster page guard contract', () => {
  it('defines server-side slug lookup, access gating, and env preflight wiring', async () => {
    const content = await readFile(pagePath, 'utf8')
    expect(content).toContain('/?auth=login_required')
    expect(content).toContain('slug: {')
    expect(content).toContain('equals: decodedSlug')
  })
})
```

---

### `tests/int/viewer-client.int.spec.ts` (test, streaming)

**Analog:** `tests/int/broadcaster-client.int.spec.ts`

**Client lifecycle contract pattern** (lines 11-24):
```typescript
describe('broadcaster client lifecycle contract', () => {
  it('wires token provider, env guard messaging, and lifecycle endpoints', async () => {
    const content = await readFile(clientPath, 'utf8')
    expect(content).toContain('tokenProvider')
    expect(content).toContain('/api/stream/broadcaster-token')
    expect(content).toContain('streamSetupMessage')
  })
})
```

Use this same style to assert viewer-specific requirements: live-only join gate, status polling hook, and 401 redirect handling in token provider.

---

### `tests/e2e/viewer.e2e.spec.ts` (test, request-response)

**Analog:** `tests/e2e/broadcaster.e2e.spec.ts`

**Minimal redirect smoke pattern** (lines 3-8):
```typescript
test.describe('broadcaster', () => {
  test('redirects unauthenticated users to login-required flow', async ({ page }) => {
    await page.goto('http://localhost:3000/broadcaster/non-existent-slug')
    await expect(page).toHaveURL(/auth=login_required/)
  })
})
```

Copy this structure and change route target to `/live/[slug]` plus state-specific assertions for scheduled/live/ended UX.

## Shared Patterns

### Authentication redirect contract
**Source:** `src/app/(frontend)/broadcaster/[slug]/page.tsx`, `src/middleware.ts`  
**Apply to:** `live/[slug]/page.tsx` (required), middleware matcher expansion (optional)
```typescript
redirect(`/?auth=login_required&returnTo=${encodeURIComponent(`/broadcaster/${decodedSlug}`)}`)
// middleware variant:
loginUrl.searchParams.set('auth', 'login_required')
loginUrl.searchParams.set('returnTo', `${pathname}${search}`)
```

### Payload Local API access control
**Source:** `src/app/(frontend)/broadcaster/[slug]/page.tsx`, `src/app/(frontend)/api/livestreams/[id]/start/route.ts`  
**Apply to:** all viewer slug/status reads
```typescript
const result = await payload.find({
  collection: 'livestreams',
  user,
  overrideAccess: false,
  where: { slug: { equals: decodedSlug } },
})
```

### Stream token endpoint + identity mapping
**Source:** `src/app/(frontend)/api/stream/token/route.ts`  
**Apply to:** viewer tokenProvider and stream user props
```typescript
const streamUserId = streamUserIdFromPayloadUser(member)
const displayName = streamDisplayName(member)
await client.upsertUsers([{ id: streamUserId, name: displayName }])
return NextResponse.json({ token, expiresAt })
```

### Stream client lifecycle safety
**Source:** `src/app/(frontend)/broadcaster/[slug]/Broadcaster.client.tsx`  
**Apply to:** `Viewer.client.tsx`
```typescript
const nextCall = nextClient.call(callType, callId)
await nextCall.join({ create: false })
// cleanup
await activeCall.leave().catch(() => null)
await activeClient.disconnectUser().catch(() => null)
```

### Env preflight for public API key
**Source:** `src/lib/stream/publicClientEnv.ts`  
**Apply to:** server page -> viewer client props
```typescript
const streamEnv = getPublicStreamEnvStatus()
streamApiKey={streamEnv.apiKey}
streamSetupMessage={streamEnv.isConfigured ? null : streamEnv.setupMessage}
```

## No Analog Found

All phase files have close analogs in the current codebase.

## Metadata

**Analog search scope:** `src/app/(frontend)`, `src/lib/stream`, `src/utilities`, `src/middleware.ts`, `tests/int`, `tests/e2e`  
**Files scanned:** 17  
**Pattern extraction date:** 2026-04-20

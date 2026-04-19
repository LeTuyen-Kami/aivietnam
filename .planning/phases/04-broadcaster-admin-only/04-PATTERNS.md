# Phase 04: broadcaster-admin-only - Pattern Map

**Mapped:** 2026-04-19  
**Files analyzed:** 8  
**Analogs found:** 7 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/app/(frontend)/broadcaster/[slug]/page.tsx` | route | request-response | `src/app/(frontend)/posts/[slug]/page.tsx` | role-match |
| `src/app/(frontend)/broadcaster/[slug]/Broadcaster.client.tsx` | component | streaming | `src/components/Auth/PostComments.tsx` (client fetch/action orchestration) | partial |
| `src/app/(frontend)/api/stream/broadcaster-token/route.ts` | route | request-response | `src/app/(frontend)/api/stream/token/route.ts` | exact |
| `src/app/(frontend)/api/livestreams/[id]/start/route.ts` | route | request-response | `src/app/(frontend)/api/site-comments/like/route.ts` | role-match |
| `src/app/(frontend)/api/livestreams/[id]/end/route.ts` | route | request-response | `src/app/(frontend)/api/site-comments/like/route.ts` | role-match |
| `src/middleware.ts` | middleware | request-response | none in repo | no-analog |
| `src/components/Livestreams/LivestreamBroadcasterLinksField.tsx` | component | transform | `src/components/Livestreams/LivestreamViewerLinksField.tsx` | exact |
| `src/collections/Livestreams/index.ts` (modify for admin deep-link UI) | model | CRUD | `src/collections/Livestreams/index.ts` + `src/components/Livestreams/LivestreamSlugActionsCell.tsx` | exact |

## Pattern Assignments

### `src/app/(frontend)/api/stream/broadcaster-token/route.ts` (route, request-response)

**Analog:** `src/app/(frontend)/api/stream/token/route.ts`

**Imports + auth bootstrap** (lines 1-13):
```typescript
import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

import { getSiteMemberUser } from '@/access/siteMemberUser'
import { getStreamServerClient } from '@/lib/stream/server'
import { streamDisplayName, streamUserIdFromPayloadUser } from '@/lib/stream/user'

export async function POST(_req: NextRequest) {
  const payload = await getPayload({ config })
  const headersList = await headers()
  const { user } = await payload.auth({ headers: headersList })
```

**Guard + token response pattern** (lines 15-43):
```typescript
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

const member = getSiteMemberUser(user)
if (!member) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

const client = getStreamServerClient()
await client.upsertUsers([{ id: streamUserId, name: displayName }])

const token = client.generateUserToken({ user_id: streamUserId, validity_in_seconds: sec })
return NextResponse.json({ token, expiresAt })
```

Apply same shape, but replace member guard with admin guard (`isUsersCollectionAdmin`) and keep Stream token minting server-side.

---

### `src/app/(frontend)/api/livestreams/[id]/start/route.ts` (route, request-response)

**Analog:** `src/app/(frontend)/api/site-comments/like/route.ts`

**JSON/body validation and auth guard** (lines 39-59):
```typescript
export async function POST(req: NextRequest) {
  let json: { commentId?: unknown }
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const commentId = typeof json.commentId === 'number' ? json.commentId : Number(json.commentId)
  if (!commentId || Number.isNaN(commentId)) {
    return NextResponse.json({ error: 'commentId is required' }, { status: 400 })
  }

  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })
```

**Local API on-behalf-of-user pattern** (lines 66-97):
```typescript
const payloadReq = await createLocalReq({ user: member }, payload)

await payload.create({
  collection: 'comment-likes',
  data: { comment: commentId, user: member.id },
  draft: false,
  req: payloadReq,
  overrideAccess: false,
  depth: 0,
})
```

Use this exact security posture for `livestreams` status/callId updates in start flow:
- authenticate with `payload.auth({ headers })`
- require `isUsersCollectionAdmin(user)`
- if passing `user` through Local API request, include `overrideAccess: false`

---

### `src/app/(frontend)/api/livestreams/[id]/end/route.ts` (route, request-response)

**Analog:** `src/app/(frontend)/api/site-comments/route.ts`

**Error-handling pattern with `APIError` fallback** (lines 164-186):
```typescript
try {
  const doc = await payload.create({ /* ... */ })
  return NextResponse.json({ doc })
} catch (e) {
  if (e instanceof APIError) {
    return NextResponse.json({ error: e.message }, { status: e.status })
  }
  const message = e instanceof Error ? e.message : 'Failed to create comment'
  return NextResponse.json({ error: message }, { status: 500 })
}
```

End route should mirror this for explicit end operation (`status=ended`), and optionally include Stream end-call branch with same JSON error semantics.

---

### `src/app/(frontend)/broadcaster/[slug]/page.tsx` (route, request-response)

**Analog:** `src/app/(frontend)/posts/[slug]/page.tsx`

**App Router param + slug load pattern** (lines 51-69):
```typescript
type Args = {
  params: Promise<{ slug?: string }>
}

export default async function Post({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const [post] = await Promise.all([queryPostBySlug({ slug: decodedSlug })])
```

**Server-side query helper pattern** (lines 336-355):
```typescript
const queryPostBySlug = cache(async ({ slug }: { slug: string }) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'posts',
    limit: 1,
    pagination: false,
    where: { slug: { equals: slug } },
  })
  return result.docs?.[0] || null
})
```

Use this same shape with `collection: 'livestreams'` and slug lookup. Add role gating before rendering the client broadcaster component.

---

### `src/components/Livestreams/LivestreamBroadcasterLinksField.tsx` (component, transform)

**Analog:** `src/components/Livestreams/LivestreamViewerLinksField.tsx`

**Field value + URL derivation pattern** (lines 8-12):
```tsx
export function LivestreamViewerLinksField() {
  const { value: slug } = useField<string>({ path: 'slug' })
  const absoluteUrl = getLivestreamViewerAbsoluteUrl(slug)
  const [copied, setCopied] = useState(false)
```

**Copy/open UX pattern** (lines 13-69):
```tsx
const onCopy = useCallback(async () => {
  if (!absoluteUrl) return
  try {
    await navigator.clipboard.writeText(absoluteUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  } catch {
    // ignore
  }
}, [absoluteUrl])
```

Duplicate this component pattern for broadcaster URL (`/broadcaster/[slug]`) and keep the same admin panel UX conventions.

---

### `src/collections/Livestreams/index.ts` (model, CRUD)

**Analog:** `src/collections/Livestreams/index.ts`

**Access model pattern** (lines 22-31):
```typescript
access: {
  create: ({ req: { user } }) => isUsersCollectionAdmin(user),
  delete: ({ req: { user } }) => isUsersCollectionAdmin(user),
  read: ({ req: { user } }) => {
    if (!user) return false
    if (isUsersCollectionAdmin(user)) return true
    return { status: { not_equals: 'draft' } }
  },
  update: ({ req: { user } }) => isUsersCollectionAdmin(user),
},
```

Keep this admin role helper and avoid introducing alternate role checks in collection config.

---

### `src/app/(frontend)/broadcaster/[slug]/Broadcaster.client.tsx` (component, streaming)

**Analog (partial):** `src/components/Auth/PostComments.tsx` (client-side request orchestration)

Use existing client-fetch orchestration and optimistic UI conventions from client components in frontend route trees. No direct Stream React SDK analog exists yet in source code; planner should follow RESEARCH.md Stream-specific integration notes for `EmbeddedLivestream` and `tokenProvider`.

## Shared Patterns

### Authentication and role checks
**Source:** `src/access/isAdminUser.ts`, `src/access/siteMemberUser.ts`  
**Apply to:** broadcaster page server guard + all broadcaster API routes
```typescript
export function isUsersCollectionAdmin(user: PayloadRequest['user']): user is User {
  if (!user || typeof user !== 'object') return false
  if (!('collection' in user)) return false
  if ((user as { collection: string }).collection !== 'users') return false
  const u = user as User
  return Boolean(u.roles?.includes('admin'))
}
```

### Server-only Stream client singleton
**Source:** `src/lib/stream/server.ts`  
**Apply to:** broadcaster token/start/end server handlers
```typescript
import 'server-only'
import { StreamClient } from '@stream-io/node-sdk'

let client: StreamClient | undefined
export function getStreamServerClient(): StreamClient {
  if (!client) {
    const { apiKey, apiSecret } = requireStreamEnv()
    client = new StreamClient(apiKey, apiSecret)
  }
  return client
}
```

### Payload auth in route handlers
**Source:** `src/app/(frontend)/api/stream/token/route.ts`  
**Apply to:** all new broadcaster API routes
```typescript
const payload = await getPayload({ config })
const headersList = await headers()
const { user } = await payload.auth({ headers: headersList })
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### Local API security when operating as user
**Source:** `src/app/(frontend)/api/site-comments/like/route.ts`, `.cursor/rules/security-critical.mdc`  
**Apply to:** livestream start/end status updates when using user-scoped req
```typescript
const payloadReq = await createLocalReq({ user: member }, payload)
await payload.update({
  collection: 'livestreams',
  id,
  data: { status: 'live' },
  req: payloadReq,
  overrideAccess: false,
})
```

### Admin link component pattern
**Source:** `src/components/Livestreams/LivestreamViewerLinksField.tsx`, `src/components/Livestreams/LivestreamSlugActionsCell.tsx`  
**Apply to:** broadcaster deep-link in Payload admin
```tsx
const absoluteUrl = getLivestreamViewerAbsoluteUrl(slug)
<a href={absoluteUrl} rel="noopener noreferrer" target="_blank">
  Open viewer
</a>
```

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `src/middleware.ts` | middleware | request-response | No existing Next middleware file in repo; implement from Next matcher conventions and Phase 4 constraints. |

## Metadata

**Analog search scope:** `src/app/(frontend)/api`, `src/app/(frontend)`, `src/access`, `src/lib/stream`, `src/components/Livestreams`, `src/collections`  
**Files scanned:** 15  
**Pattern extraction date:** 2026-04-19

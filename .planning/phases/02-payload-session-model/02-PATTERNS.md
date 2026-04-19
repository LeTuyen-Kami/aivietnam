# Phase 2 — Pattern Map (Payload session model)

## Files to create / modify

| File | Role | Closest analog in repo |
|------|------|------------------------|
| `src/collections/Livestreams/index.ts` | New collection config | `src/collections/Posts/index.ts` (`slugField`, `slugifyTitle`), `src/collections/Users/index.ts` (roles, admin) |
| `src/payload.config.ts` | Register collection | Existing `collections: [ Pages, Posts, ... ]` array |
| `src/payload-types.ts` | Regenerated types | `pnpm generate:types` — **do not hand-edit** |

## Data flow

1. **Admin** creates/edits `livestreams` in Payload Admin — gated by `isUsersCollectionAdmin` on create/update/delete.
2. **Read:** Unauthenticated API/REST callers get no documents (`access.read` → `false`). Authenticated **admin** reads all rows. Authenticated **non-admin** reads only rows with `status` not equal to `draft`.
3. **Later phases:** Viewer/broadcaster load by `slug` via Local API with `user` + `overrideAccess: false` or server with appropriate user context.

## Conventions to match

- **Imports:** `CollectionConfig` from `payload`; `slugField` from `payload`; `slugifyTitle` from `@/utilities/slugify`.
- **Admin helper:** `isUsersCollectionAdmin` from `@/access/isAdminUser` (or relative path consistent with sibling collections).
- **No** thumbnail/relationship to Posts in Phase 2 unless CONTEXT changes.

## Code excerpts (reference)

**Admin gate (pattern):**

```typescript
import { isUsersCollectionAdmin } from '@/access/isAdminUser'

// access.create example
create: ({ req: { user } }) => isUsersCollectionAdmin(user),
```

**Read with query constraint (intent — exact shape in implementation):**

```typescript
read: ({ req: { user } }) => {
  if (!user) return false
  if (isUsersCollectionAdmin(user)) return true
  return { status: { not_equals: 'draft' } }
}
```

**Slug field (pattern from Posts):**

```typescript
slugField({
  slugify: ({ valueToSlugify }) => slugifyTitle(valueToSlugify),
}),
```

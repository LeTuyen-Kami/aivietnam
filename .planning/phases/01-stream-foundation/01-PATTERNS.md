# Phase 1 — Pattern Map (Stream foundation)

## Files to create / modify

| File | Role | Closest analog in repo |
|------|------|------------------------|
| `src/app/(frontend)/api/stream/token/route.ts` | Authenticated POST API | `src/app/(frontend)/api/site-comments/route.ts` (`getPayload`, `payload.auth({ headers })`) |
| `src/lib/stream/server.ts` | Server singleton for third-party client | No exact singleton yet — pattern similar to lazy init in `src/payload.config.ts` imports |
| `src/lib/stream/user.ts` (or `mapUser.ts`) | Pure mapping + JSDoc | `src/access/siteMemberUser.ts` (small pure helpers) |
| `.env.example` | Document new vars | Existing Google OAuth / DB vars |
| `src/environment.d.ts` | Type `process.env` | Existing `src/environment.d.ts` |

## Data flow

1. Browser (later phases) → `POST /api/stream/token` with `Cookie: payload-token=…`
2. Route → `payload.auth({ headers })` → if no user, **401**
3. Route → `getStreamServerClient()` → `upsertUsers([{ id: String(user.id), name }])`
4. Route → `generateUserToken({ user_id, validity_in_seconds })` → JSON `{ token, expiresAt }`

## Conventions to match

- **Imports:** `@payload-config`, `@/payload-types`
- **Quotes / formatting:** Prettier config in `.prettierrc.json`
- **No** `NEXT_PUBLIC_*` for secrets

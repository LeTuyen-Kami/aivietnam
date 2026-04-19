# Phase 1: Stream foundation - Context

**Gathered:** 2026-04-19  
**Status:** Ready for planning

> **Tóm tắt (tiếng Việt):** Đã chốt cách triển khai Phase 1: dùng **chuỗi `user.id` của Payload** làm Stream `user_id`; **POST `/api/stream/token`** (chỉ user đã đăng nhập) trả JWT; **TTL mặc định 3600 giây**, chỉnh bằng env; **Stream server SDK** (`@stream-io/node-sdk`) dạng **singleton lazy** trên server; **upsert** user Stream khi cấp token (id + name + ảnh nếu có). Secret chỉ server — không bundle. Chi tiết kỹ thuật dưới cho researcher/planner (tiếng Anh).

<domain>
## Phase Boundary

Server can authenticate to Stream with credentials from environment variables (no secrets in client bundle), expose one authenticated API that returns a valid Stream JWT for the logged-in Payload user, and document a stable Payload → Stream user mapping (STRM-01, STRM-02, STRM-03). No Payload livestream collection yet (Phase 2); no admin/viewer UI (Phases 3–5).

</domain>

<decisions>
## Implementation Decisions

### User identity (STRM-03)

- **D-01:** Use **`String(payloadUser.id)`** as the Stream **`user_id`** for `generateUserToken` and for `upsertUsers` / client `User.id`. No extra prefix unless a future multi-tenant requirement appears (then add a prefix in a dedicated phase).

### User upsert

- **D-02:** When issuing a token, **upsert** the Stream user with at least **`id`** and, when available, **`name`** and **`image`** from Payload so the Stream dashboard and calls show sensible labels. Idempotent on each token request.

### Token HTTP API (STRM-02)

- **D-03:** **`POST /api/stream/token`** — Next.js App Router handler under `src/app/(frontend)/api/stream/token/route.ts` (or equivalent path; keep under `(frontend)/api` alongside existing auth patterns).

- **D-04:** **Authentication:** require a **logged-in Payload user** (same session/cookie model as `/api/users/me` — do not accept anonymous calls). Return **401** if unauthenticated.

- **D-05:** **Response body:** JSON `{ "token": string, "expiresAt": string }` where `expiresAt` is **ISO 8601** timestamp for when the JWT should be treated as expired by the client. (Client SDK may still validate; this supports UI and debugging.)

### JWT lifetime

- **D-06:** Use **`generateUserToken`** with **`validity_in_seconds`** (SDK default **3600**). Override via **`STREAM_TOKEN_VALIDITY_SECONDS`** (optional env); document in `.env.example`.

- **D-07:** Do **not** use **`generatePermanentUserToken`** for end users. Reserve permanent tokens only for a future explicit service/bot account if ever needed.

- **D-08:** **Client behavior (later phases):** obtain a **fresh token** when initializing `StreamVideoClient` or before joining a call if the current token is near expiry — not a single token stored for weeks.

### Environment and server client (STRM-01)

- **D-09:** **Server-only env:** `STREAM_API_KEY`, `STREAM_API_SECRET` (names align with GetStream dashboard / `@stream-io/node-sdk` `StreamClient` constructor). Optional: `STREAM_TOKEN_VALIDITY_SECONDS`.

- **D-10:** **Public API key for browser (Phase 4–5):** the React SDK needs the **same API key** as a public value — add **`NEXT_PUBLIC_STREAM_API_KEY`** when implementing client video UI (can equal `STREAM_API_KEY`; still not a secret per Stream). **Phase 1** implementation may only touch server env vars; document the future variable in `.env.example` comments.

- **D-11:** **Server Stream client:** one **lazy singleton** module (e.g. `src/lib/stream/server.ts`) that instantiates **`StreamClient`** from `@stream-io/node-sdk` with env vars — import **only** from Server Components, Route Handlers, or `server-only` modules.

### Claude's Discretion

- Exact filename for the singleton module and whether upsert runs **every** token request vs **if-not-recently-updated** — planner may choose; **idempotent upsert each time** is acceptable for v1.

### Folded Todos

_None — no matching todos._

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & requirements

- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, requirement IDs STRM-01–03
- `.planning/REQUIREMENTS.md` — STRM-01, STRM-02, STRM-03 definitions and traceability
- `.planning/PROJECT.md` — Vision, security constraints, stack (pnpm + bun scripts)

### Codebase maps

- `.planning/codebase/STACK.md` — Next.js 15, Payload 3, Postgres, existing API patterns
- `.planning/codebase/INTEGRATIONS.md` — Auth/cookies, env patterns
- `.planning/codebase/ARCHITECTURE.md` — App structure (if referenced during planning)

### Implementation touchpoints (existing code)

- `src/utilities/getMeUser.ts` — pattern for authenticated `fetch` with JWT cookie
- `src/providers/Auth/index.tsx` — `/api/users/me` session shape
- `src/collections/Users/index.ts` — `users` slug, `auth: true`, roles

### External SDK

- `@stream-io/node-sdk` — `StreamClient`, `generateUserToken({ user_id, validity_in_seconds, ... })`, `upsertUsers`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **Auth:** Cookie-based Payload JWT (`payload-token`) and `/api/users/me` — token route should use the same authentication mechanism.
- **Users collection:** `id`, `name`, and profile fields suitable for Stream `upsertUsers` display metadata.

### Established Patterns

- **Route Handlers** under `src/app/(frontend)/api/` for custom APIs (e.g. Google OAuth, `geo-ip`).
- **Environment:** `.env.example` lists public and secret vars; extend with `STREAM_*` without committing secrets.

### Integration Points

- New **`POST /api/stream/token`** callable from future client code that already has Payload session cookies.
- **Server-only** module for `StreamClient` — no import from client components.

### Later phases

- **Phase 4–5:** `@stream-io/video-react-sdk` / `StreamVideoClient` will need **`apiKey`** (public) + **`token`** from this API + **`user.id`** matching **D-01**.

</code_context>

<specifics>
## Specific Ideas

- User asked for discussion in **Vietnamese**; implementation docs and this file’s technical sections remain English-first for tooling/agents.
- Selection: **all four** gray areas (mapping, API contract, TTL, env + singleton).

</specifics>

<deferred>
## Deferred Ideas

_None — discussion stayed within Phase 1 scope._

### Reviewed Todos (not folded)

_None._

</deferred>

---

*Phase: 01-stream-foundation*  
*Context gathered: 2026-04-19*

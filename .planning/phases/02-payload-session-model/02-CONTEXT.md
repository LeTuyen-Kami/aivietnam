# Phase 2: Payload session model - Context

**Gathered:** 2026-04-19  
**Status:** Ready for planning

> **Tóm tắt (tiếng Việt):** Collection Payload cho **phiên livestream** với trường tối thiểu phục vụ Stream (`callId`, `callType`, …), **chỉ admin** tạo/sửa/xóa. **Đọc:** không cho khách ẩn danh; **user đã đăng nhập** mới đọc được bản ghi ở trạng thái không phải draft; **draft** chỉ admin. Trạng thái: `draft` | `scheduled` | `live` | `ended`. Slug công khai cho route `/live/[slug]` (Phase 5) — sinh từ tiêu đề bằng `slugifyTitle` nếu để trống, admin có thể sửa. Sau schema chạy `generate:types`.

<domain>
## Phase Boundary

Persist **livestream session** documents in Payload: fields needed to join Stream (`callId`, `callType`, etc.), human-facing metadata (title, status, slug for the public viewer URL). **Admin-only** create/update/delete. **Read** is **not** anonymous: only **authenticated** users may read non-draft sessions; **draft** documents are visible to **admins only**. Implements CMS-01 and CMS-02 with this access model. Does **not** include Admin list UI (Phase 3), broadcaster, or viewer pages (Phases 4–5).

</domain>

<decisions>
## Implementation Decisions

### Collection identity

- **D-01:** New collection slug **`livestreams`** (singular document = one livestream session).

### Field schema (CMS-01)

- **D-02:** **Required:** `title` (text), `slug` (text, **unique**, indexed), `status` (select), `callId` (text — Stream call id), `callType` (text, default **`livestream`** to match Stream Video usage).
- **D-03:** **Optional in Phase 2:** `description` (textarea or plain text), `scheduledAt` (date — when the session is intended to go live). Omit relationship to Posts/Pages unless a need appears in planning; **no** thumbnail in Phase 2 unless planner folds a small upload field (Claude discretion: default **no** thumbnail field in Phase 2).
- **D-04:** **`timestamps: true`** (created/updated).

### Status lifecycle

- **D-05:** `status` options: **`draft`**, **`scheduled`**, **`live`**, **`ended`** (aligns with roadmap Phase 3 quick-scan states).
- **D-06:** **Draft:** readable only by **admin** (same as other write operations). **scheduled / live / ended:** readable by **any authenticated** Payload user (`req.user` present).

### Access control (CMS-02 + user requirement)

- **D-07:** **Create / update / delete:** **admin only** (reuse `isUsersCollectionAdmin` pattern from `users` / project access helpers).
- **D-08:** **Read:** **not** public/anonymous. If **`req.user`** is absent → **no read**. If present: **admin** → read all; **non-admin** → read only where **`status` is not `draft`** (query constraint or equivalent boolean logic per Payload access rules).
- **D-09:** **REST / GraphQL:** Same rules via collection `access.read` (no separate “public API” bypass for anonymous clients).
- **D-10:** **Local API:** When passing `user`, use **`overrideAccess: false`** so access rules apply (per project security rules).

### Slug & URL contract (Phase 5 alignment)

- **D-11:** **`slug`** is the stable segment for the future route **`/live/[slug]`** (exact path finalized in Phase 5).
- **D-12:** If **`slug`** is empty on create/update and **`title`** is set, derive with **`slugifyTitle`** from `@/utilities/slugify` (same family as Posts). Admin may override manually in Payload.
- **D-13:** **Uniqueness:** enforce unique `slug`; on collision, validation error or deterministic suffix — **Claude’s discretion** in implementation.

### Types & hooks

- **D-14:** After schema changes run **`generate:types`** (pnpm script as in repo).
- **D-15:** **Hooks:** use **`req`** on any nested Local API calls; no infinite update loops. Optional **`beforeValidate`** for slug fill — **Claude’s discretion** on exact hook placement.

### Claude's Discretion

- Exact Payload `access.read` shape (boolean vs query constraint) for “non-draft for members”.
- Collision handling for duplicate slugs.
- Whether `scheduledAt` is required when `status === 'scheduled'` (optional validation tightening).

### Folded Todos

_None — no matching todos._

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & requirements

- `.planning/ROADMAP.md` — Phase 2 goal, plans 02-01 / 02-02, CMS-01, CMS-02
- `.planning/REQUIREMENTS.md` — CMS-01, CMS-02 definitions
- `.planning/PROJECT.md` — Security, stack, Payload conventions

### Prior phase

- `.planning/phases/01-stream-foundation/01-CONTEXT.md` — Stream `user_id` = `String(payloadUser.id)`; token API (join calls in later phases)

### Codebase maps

- `.planning/codebase/STACK.md` — Payload 3, Postgres, type generation
- `.planning/codebase/ARCHITECTURE.md` — App and collections layout
- `.planning/codebase/INTEGRATIONS.md` — Auth/session patterns

### Implementation patterns (existing code)

- `src/collections/Users/index.ts` — `roles`, `saveToJWT`, admin checks
- `src/access/isAdminUser.ts` — admin role helper
- `src/collections/Posts/index.ts` — `slugField`, `slugifyTitle`, access patterns (adapt read rule; do not copy `authenticatedOrPublished` for this collection)
- `src/utilities/slugify.ts` — `slugifyTitle`
- `src/payload.config.ts` — register new collection in `collections` array
- `AGENTS.md` (repo root / workspace rules) — Local API `overrideAccess`, `req` in hooks

### External

- Payload CMS docs — collections, access control, field types, unique indexes

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`isUsersCollectionAdmin`** — gate admin-only create/update/delete on `livestreams`.
- **`slugifyTitle`** — default slug from title; **`slugField`** from Payload used elsewhere (Posts) for slug behavior.
- **`authenticated`** helper — reference for “logged-in” checks; livestream read needs **stricter** rule (authenticated + not draft for non-admins).

### Established Patterns

- Collections registered in **`src/payload.config.ts`**; **`typescript.outputFile`** → regenerate **`payload-types.ts`** after schema change.
- Access: combine admin checks with query constraints where row-level rules apply.

### Integration Points

- Phase 4–5: server routes and viewer load **`livestreams`** by **`slug`** after session check; token still from **`POST /api/stream/token`** (Phase 1).
- Stream **`callId`** / **`callType`** stored on document for join/publish flows.

</code_context>

<specifics>
## Specific Ideas

- User (Vietnamese): **chỉ đăng nhập mới được xem** — encoded as **D-07–D-10** (no anonymous read; members see non-draft sessions).
- User chose to discuss **all** listed gray areas in one pass.

</specifics>

<deferred>
## Deferred Ideas

- Anonymous/public viewer without login — **out of scope** for v1 per user decision; revisiting would be a product change + new phase.
- Thumbnail / rich scheduling / multi-host — deferred unless pulled into a later phase roadmap item.

### Reviewed Todos (not folded)

_None._

</deferred>

---

*Phase: 02-payload-session-model*  
*Context gathered: 2026-04-19*

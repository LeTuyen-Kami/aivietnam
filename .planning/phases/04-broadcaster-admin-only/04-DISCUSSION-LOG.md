# Phase 4: Broadcaster (admin-only) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in `04-CONTEXT.md` — this log preserves alternatives considered.

**Date:** 2026-04-19  
**Phase:** 4 — Broadcaster (admin-only)  
**Areas discussed:** Route & entry point, Create/join + Payload sync, Token & publish permission, Lifecycle & status

---

## Route & entry point

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated route | `/broadcaster/[slug]` (guarded) | ✓ |
| Only reachable from Payload | Link-only entry from admin | |
| You decide | Best for codebase | |
| Other | Free text | |

**User's choice:** `/broadcaster/[slug]` — chosen so the URL shape can support future expansion beyond admin-only broadcasting.  
**Notes:** Non-admin broadcasting itself is deferred (out of Phase 4 scope).

| Option | Description | Selected |
|--------|-------------|----------|
| 404 | Don’t reveal | |
| 403 | Access denied page | |
| Redirect/login+403 | Login if logged out; 403 if logged in but not admin | ✓ |
| You decide | Best default | |
| Other | Free text | |

**User's choice:** Redirect to login if logged out; if logged in but not admin show 403.

| Option | Description | Selected |
|--------|-------------|----------|
| Admin nav | Link in site nav for admins | |
| From Payload | Payload deep-link | |
| Both | Admin nav + Payload link | |
| You decide | Best default | ✓ |
| Other | Free text | |

**User's choice:** You decide.  
**Notes:** Default chosen: Payload deep-link first; admin nav can be added later.

---

## Create / join + Payload sync

| Option | Description | Selected |
|--------|-------------|----------|
| Doc id | Derive callId from Payload doc id | |
| Slug | Derive callId from slug | |
| UUID | Random UUID stored in Payload | |
| You decide | Best default | ✓ |
| Other | Free text | |

**User's choice:** You decide.  
**Notes:** Default chosen: use Payload doc id as Stream `callId`.

| Option | Description | Selected |
|--------|-------------|----------|
| Payload first | Create/ensure doc → then Stream | |
| Stream first | Stream → then Payload | |
| Ensure existing | Start only from existing Payload doc | ✓ |
| You decide | Best default | |
| Other | Free text | |

**User's choice:** Start only from an existing Payload doc created in Admin.

| Option | Description | Selected |
|--------|-------------|----------|
| By slug | `/broadcaster/[slug]` loads doc by slug | |
| By id | Use id in URL | |
| You decide | Best default | ✓ |
| Other | Free text | |

**User's choice:** You decide.  
**Notes:** Default chosen: keep `/broadcaster/[slug]` and load by `slug`.

| Option | Description | Selected |
|--------|-------------|----------|
| Create if missing | Ensure Stream call exists, then join as publisher | ✓ |
| Require exists | Error if missing | |
| You decide | Best default | |
| Other | Free text | |

**User's choice:** Create/ensure call if missing, then join as publisher.

---

## Token & publish permission

| Option | Description | Selected |
|--------|-------------|----------|
| Split routes | Keep `/api/stream/token` for members; add admin-only publish token route | ✓ |
| Admin-only `/api/stream/token` | Viewer will need separate route | |
| Single route param | One route, role-gated output | |
| You decide | Best default | |
| Other | Free text | |

**User's choice:** Split routes (member token stays; add admin-only publish token).

| Option | Description | Selected |
|--------|-------------|----------|
| Server-only | Only server checks role | |
| Middleware + server | Middleware for UX + server for security | ✓ |
| You decide | Best default | |
| Other | Free text | |

**User's choice:** Enforce admin role in both middleware and server.

---

## Lifecycle & status

| Option | Description | Selected |
|--------|-------------|----------|
| Live on join success | Set status `live` when publisher join succeeds | ✓ |
| Live on click | Set `live` on Start click | |
| Manual in admin | Operator changes in Payload | |
| You decide | Best default | |
| Other | Free text | |

**User's choice:** `live` when publisher join succeeds.

| Option | Description | Selected |
|--------|-------------|----------|
| End on button | Set `ended` when admin clicks End | ✓ |
| End on leave | Set `ended` on tab close | |
| Manual in admin | Operator changes in Payload | |
| You decide | Best default | |
| Other | Free text | |

**User's choice:** `ended` when admin clicks End.

| Option | Description | Selected |
|--------|-------------|----------|
| Auto re-join | Refresh auto re-joins as publisher | ✓ |
| Resume button | Require manual resume | |
| Viewer-only | Refresh joins viewer; require publish action | |
| You decide | Best default | |
| Other | Free text | |

**User's choice:** Auto re-join as publisher on refresh.

---

## Claude's Discretion

- Exact token endpoint path naming for broadcaster publish token route.
- Whether orchestration uses server actions vs route handlers (must still enforce admin + update Payload status per decisions).

## Deferred Ideas

- Allow non-admin users to broadcast (future phase / v2).


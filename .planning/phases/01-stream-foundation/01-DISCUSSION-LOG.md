# Phase 1: Stream foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in `01-CONTEXT.md`.

**Date:** 2026-04-19  
**Phase:** 1 — Stream foundation  
**Areas discussed:** Stream user ID mapping, Token API contract, JWT lifetime and minting, Env vars + server client lifecycle  
**Mode:** `[--all]` — user selected all gray areas; assistant applied SDK-backed recommendations.

---

## Stream user ID mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Raw Payload `user.id` as string | Stable 1:1 with CMS user; simplest for STRM-03 | ✓ |
| Prefixed id (`payload:…`) | Extra collision avoidance across systems | |
| Other | User-defined scheme | |

**User's choice:** Raw `String(user.id)` as Stream `user_id`.  
**Notes:** Matches `User.id` expected by `@stream-io/video-react-sdk` when wired in later phases.

---

## Token API contract

| Option | Description | Selected |
|--------|-------------|----------|
| POST `/api/stream/token` | Body optional; avoids caching issues; aligns with authenticated action | ✓ |
| GET `/api/stream/token` | Simpler for fetch but easier to cache accidentally | |

**User's choice:** POST under App Router `(frontend)/api`.  
**Response:** `{ token, expiresAt }` with ISO `expiresAt`.  
**Notes:** 401 when no Payload session.

---

## JWT lifetime and when to mint

| Option | Description | Selected |
|--------|-------------|----------|
| `validity_in_seconds` = 3600 (configurable) | Default matches `@stream-io/node-sdk` `generateUserToken` default | ✓ |
| Very short (e.g. 300s) only | Stricter; more token requests | |
| Permanent user token | Rejected for humans | |

**User's choice:** Default 3600s; optional env `STREAM_TOKEN_VALIDITY_SECONDS`; refresh token when joining / client init in later phases.

---

## Env vars + server Stream client lifecycle

| Option | Description | Selected |
|--------|-------------|----------|
| `STREAM_API_KEY` + `STREAM_API_SECRET` | Matches Stream dashboard / Node SDK constructor | ✓ |
| Lazy singleton `StreamClient` | One instance per server process; no per-request secret reload | ✓ |
| New client per request | Wasteful; still valid but not chosen | |

**User's choice:** Singleton server module; document `NEXT_PUBLIC_STREAM_API_KEY` for future React SDK in `.env.example` comments.

---

## Claude's Discretion

- Minor file layout for singleton and whether to optimize upsert frequency — see CONTEXT.md.

## Deferred Ideas

_None recorded._

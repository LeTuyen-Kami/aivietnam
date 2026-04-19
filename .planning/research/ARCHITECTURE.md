# Architecture Research — Stream + Payload

**Researched:** 2026-04-19

## Components

1. **Stream Cloud** — Real-time call state, media routing (managed by Stream)
2. **Next.js server** — `route.ts` handlers: issue token, optionally create/update call metadata; `overrideAccess` discipline when using Local API with user
3. **PostgreSQL / Payload** — System of record for “session” entity: title, slug/route, `callId`, status, visibility, scheduled time
4. **Payload Admin** — CRUD + custom view for operators
5. **Frontend** — Admin-only “create/go live” flow; public “watch” page with `LivestreamLayout`

## Data flow

```
Admin → Frontend (authenticated) → API → Payload (persist session) + Stream (create/join call)
Viewer → Public page → API (token) → StreamVideoClient → join as viewer
```

## Suggested build order

1. Env + server SDK + token endpoint (no UI)
2. Payload collection + types
3. Admin management surfaces
4. Broadcaster UI (admin route)
5. Viewer page + SEO/meta basics

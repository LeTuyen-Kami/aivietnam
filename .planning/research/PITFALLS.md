# Pitfalls Research — Stream + Next + Payload

**Researched:** 2026-04-19

| Pitfall | Warning signs | Prevention | Phase |
|---------|---------------|------------|-------|
| Secret leaked to client | Secret in client bundle, env typo `NEXT_PUBLIC` | Code review; only server routes touch `StreamClient` | 1 |
| Local API bypass | Missing `overrideAccess: false` when passing `user` | Follow AGENTS.md Payload rules | 2–3 |
| User id mismatch | Random IDs between Payload and Stream | Deterministic mapping (e.g. `stream_${payloadUserId}`) documented | 1–2 |
| Duplicate create | Double submit on “go live” | Idempotent server action or disable button; store `callId` once | 4 |
| Viewer before live | Black screen / errors | UI states: scheduled, live, ended; optional polling Stream or webhooks later | 5 |

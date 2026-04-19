# Pitfalls Research

**Domain:** Livestream on serverless + CMS  
**Researched:** 2026-04-19

| Pitfall | Warning Signs | Prevention | Phase |
|---------|---------------|------------|-------|
| Assuming plugin alone delivers **RTMP live** | Only VOD upload in README | Confirm Mux Live API integration; spike early | 1–2 |
| **Viewer count** wrong under load | Count drifts >50 or blocks legit users | Heartbeat + TTL; Redis INCR/DECR or dedicated realtime room limits | 4 |
| **Webhook security** | Unsigned or replayed events | Verify `MUX_WEBHOOK_SIGNING_SECRET` per Mux docs | 1 |
| **Chat abuse** | Spam in public live | Rate limit + optional min account / slow mode | 5 |
| **Local API access** | Data leaks via `overrideAccess` default | `overrideAccess: false` whenever `user` passed | All |

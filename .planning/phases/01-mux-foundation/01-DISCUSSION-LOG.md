# Phase 1: Mux foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in `01-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-19  
**Phase:** 1 — Mux foundation  
**Areas discussed:** Webhook proof in dev, Plugin defaults vs naming, VOD-only spike outcome, Documentation surface (`all` selected)

---

## Webhook proof in development

| Option | Description | Selected |
|--------|-------------|----------|
| HTTPS tunnel (primary) | ngrok / Cloudflare Tunnel / equivalent to receive Mux POSTs locally with signing on | ✓ |
| Preview URL only | Vercel (or similar) preview as main verification when tunnel is impractical | ✓ (secondary) |
| Dashboard-only manual | Rely on Mux UI alone without documented app-side proof |  |

**User's choice:** All gray areas selected; **primary = tunnel**, **secondary = preview**, **verified** = documented successful signed handling + SUMMARY steps.

**Notes:** Aligns with MUX-01 “webhook route reachable as documented by the plugin.”

---

## Plugin defaults vs naming

| Option | Description | Selected |
|--------|-------------|----------|
| Keep defaults | Default collection slug and webhook/API paths from plugin | ✓ |
| Rename early | Custom slugs/paths for future “live session” naming consistency |  |

**User's choice:** Keep defaults (D-04).

**Notes:** Reduces churn before Phase 2 session model.

---

## VOD-only / spike outcome

| Option | Description | Selected |
|--------|-------------|----------|
| Document + roadmap follow-up | SUMMARY states limits; insert decimal phase or Phase 2 note for Mux Live proof | ✓ |
| Document only | Write-up with no roadmap change |  |
| Expand Phase 1 scope | Build Mux Live proof in same phase without roadmap change |  |

**User's choice:** Explicit SUMMARY + **roadmap follow-up** if Live not proven (D-05, D-06).

---

## Documentation surface

| Option | Description | Selected |
|--------|-------------|----------|
| `.env.example` + Phase 1 SUMMARY | Env template + operator steps for Mux dashboard and verification | ✓ |
| `.env.example` only | Variables without narrative |  |
| Root README section | Long-form in README instead of/in addition to SUMMARY |  |

**User's choice:** `.env.example` + Phase 1 SUMMARY (D-07, D-08).

---

## Claude's Discretion

- Specific tunnel vendor and minor plugin flags — document in SUMMARY; not user-locked.

## Deferred Ideas

- Realtime vendor, comment auth policy — later phases / not Phase 1.

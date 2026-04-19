# Phase 1: Mux foundation - Context

**Gathered:** 2026-04-19  
**Status:** Ready for planning

<domain>
## Phase Boundary

Install and configure `@oversightstudio/mux-video` in Payload, document required Mux environment variables, verify the Mux webhook path works end-to-end in a documented way, and regenerate Payload types and the admin import map so the repo reflects the plugin. This phase does **not** add the live session collection, admin session workflows, public watch page, viewer cap, or comments/reactions — those are Phases 2–5.

</domain>

<decisions>
## Implementation Decisions

### Webhook proof in development

- **D-01:** **Primary** verification path for local dev: expose the app’s Mux webhook URL via an **HTTPS tunnel** (e.g. ngrok, Cloudflare Tunnel, or equivalent) so Mux can POST to the documented plugin route; confirm **signature verification** is enabled and at least one delivery is handled successfully.
- **D-02:** **Secondary** acceptable path when a tunnel is impractical: use a **preview deployment URL** (e.g. Vercel preview) with the same webhook route and env secrets, and document that as the verification environment in Phase 1 SUMMARY.
- **D-03:** **Definition of “verified”** for success criteria: at least one **successful** webhook processing run (visible in app logs or consistent with Mux dashboard delivery history) with signing secret configured — exact commands/steps captured in Phase 1 **SUMMARY**, not only in chat.

### Plugin defaults and naming

- **D-04:** Keep the plugin’s **default** collection slug and **default** API/webhook route paths **unless** the plugin README requires overrides for Payload 3 / this repo. Do **not** rename routes or collection slugs for aesthetics in Phase 1; revisit naming only if Phase 2 session model or security review requires it.

### If the plugin path is VOD-first (spike outcome)

- **D-05:** If Phase 1 shows the plugin is **VOD/upload-oriented** and does not yet cover **Mux Live** end-to-end, record that **explicitly** in Phase 1 SUMMARY (what was proven, what was not, links to Mux dashboard checks).
- **D-06:** Treat **true live (RTMP / Live Stream)** as **unset** until proven. **Follow-up:** adjust the roadmap (e.g. `/gsd-insert-phase` decimal phase or Phase 2 scope note) for a **dedicated Mux Live proof** before building viewer-facing “live” in Phase 4 — do **not** assume Live works without a written decision.

### Documentation surface

- **D-07:** **`.env.example`:** list every Mux-related variable required by MUX-01 (e.g. `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_WEBHOOK_SIGNING_SECRET`, `NEXT_PUBLIC_SERVER_URL` / `cors` as required by the plugin) with short comments; no secrets committed.
- **D-08:** **Phase 1 SUMMARY:** include **operator steps** — Mux dashboard webhook URL, signing secret, and which verification path was used (tunnel vs preview). This is the canonical onboarding path for the team.

### Claude's Discretion

- Choice of specific tunnel tool (ngrok vs Cloudflare vs other) and minor plugin option flags not locked here — pick what matches repo deploy reality and plugin README, document in SUMMARY.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and roadmap

- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, dependency notes (decimal phase if Live proof needed).
- `.planning/REQUIREMENTS.md` — **MUX-01**, **MUX-02** (plugin config, env, webhook reachability, types + import map).
- `.planning/PROJECT.md` — Security (webhook signature), stack constraints, Key Decisions table.

### Research

- `.planning/research/SUMMARY.md` — VOD-first plugin risk, spike expectations, Live vs VOD alignment.

### Plugin (external)

- [`@oversightstudio/mux-video` (GitHub)](https://github.com/oversightstudio/payload-plugins/tree/main/packages/mux-video) — install and webhook behavior (verify against version pinned in `package.json` at implementation time).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`src/payload.config.ts`** — `buildConfig`, Postgres adapter, `plugins` import from `./plugins`; new Mux plugin registers here.
- **`src/plugins/index.ts`** — Existing Payload plugins pattern; add Mux video plugin alongside current plugins per project conventions.

### Established Patterns

- **Types / import map:** After schema or plugin changes, run project scripts for `generate:types` and `generate:importmap` as required by MUX-02 and `AGENTS.md`.
- **Security:** Webhook handlers must verify Mux signatures; Local API calls with `user` must use `overrideAccess: false` where applicable (see `AGENTS.md`).

### Integration Points

- **Next / Payload:** `withPayload` Next integration; webhook route will live under the app’s API routes as determined by the plugin and `routes` config.
- **Env:** `src/environment.d.ts` — extend typings when new env vars are added.

### Creative options

- No Mux integration in repo yet; Phase 1 is greenfield wiring with the decisions above constraining verification and documentation.

</code_context>

<specifics>
## Specific Ideas

- User selected **all** proposed gray areas in discuss-phase; decisions above follow the **recommended** options from that session (tunnel-first verification, keep plugin defaults, explicit VOD vs Live follow-up, `.env.example` + SUMMARY docs).

</specifics>

<deferred>
## Deferred Ideas

- **Realtime transport** for comments/reactions (Phase 5) — not decided here.
- **Anonymous vs authenticated comments** (ENG-01) — discussed in project STATE as future discuss; not Phase 1.
- **Mux Live API** custom routes or non-plugin code paths — only if D-05/D-06 trigger follow-up phase; not part of minimal Phase 1 scope unless spike proves necessity.

### Reviewed Todos (not folded)

- None — no pending todos matched Phase 1.

</deferred>

---

*Phase: 01-mux-foundation*  
*Context gathered: 2026-04-19*

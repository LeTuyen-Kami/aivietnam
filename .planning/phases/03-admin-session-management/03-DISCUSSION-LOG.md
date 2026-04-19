# Phase 3: Admin session management - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in `03-CONTEXT.md`.

**Date:** 2026-04-19  
**Phase:** 3 — Admin session management  
**Areas discussed:** List columns & sort, Status at-a-glance, Operational links (ADM-02), Edit view vs list (preview)

---

## Selection

**User's choice:** Discuss **all** numbered gray areas from the discuss-phase prompt (areas 1–4).

**Notes:** Substantive options were finalized using the **recommended** package aligned with `.planning/REQUIREMENTS.md` (ADM-01, ADM-02), Phase 2 `livestreams` / `/live/[slug]` contract, and existing repo patterns (`getServerSideURL`, Posts admin preview wiring).

---

## 1. List columns & default sort

| Option | Description | Selected |
|--------|-------------|----------|
| A | `defaultColumns`: title, slug, status, scheduledAt, updatedAt; omit callId from default list | ✓ |
| B | Include callId in default columns | |
| C | Minimal columns only (no scheduledAt) | |

**User's choice:** A  
**Notes:** Default sort: **updatedAt descending** (D-02 in CONTEXT).

---

## 2. Status at-a-glance

| Option | Description | Selected |
|--------|-------------|----------|
| A | Custom list **Cell** for `status` with semantic colors | ✓ |
| B | Plain text only | |

**User's choice:** A  

---

## 3. Operational links (ADM-02)

| Option | Description | Selected |
|--------|-------------|----------|
| A | Open viewer `/live/[slug]` in new tab + copy **absolute** URL (via `getServerSideURL`) | ✓ |
| B | Copy only | |
| C | Open only | |

**User's choice:** A  
**Notes:** Stream Dashboard links deferred.

---

## 4. Edit view vs list (preview)

| Option | Description | Selected |
|--------|-------------|----------|
| A | `admin.preview` + `admin.livePreview` on `livestreams` using **viewer** URL (not `generatePreviewPath` draft flow) | ✓ |
| B | List-only affordances, no document preview | |

**User's choice:** A  

---

## Claude's Discretion

- Payload component paths, icon vs button for copy, exact status color tokens — see CONTEXT **D-08** and Claude's Discretion section.

## Deferred Ideas

- Stream.io external dashboard links — see CONTEXT `<deferred>`.

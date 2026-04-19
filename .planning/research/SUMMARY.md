# Project Research Summary

**Project:** AI Vietnam — Livestream (Mux) milestone  
**Domain:** Embedded live video + realtime engagement in Payload/Next  
**Researched:** 2026-04-19  
**Confidence:** MEDIUM

## Executive Summary

The initiative adds **live sessions** to the existing monolith: **Mux** for video delivery (starting with [`@oversightstudio/mux-video`](https://github.com/oversightstudio/payload-plugins/tree/main/packages/mux-video)), **admin-only** creation UI, a **public watch** page, a **50 concurrent viewer** cap, and **comments + heart-style reactions**. The main technical risk is aligning **true live (RTMP → Mux Live Stream)** with a plugin documented primarily for **VOD uploads**; early spike should prove playback and webhook flow. Realtime engagement needs a **small-scale fan-out** mechanism; **in-memory** counters are insufficient on multi-instance hosting — use **Redis/KV** or a **managed realtime** product.

## Key Findings

### Recommended Stack

- **Mux** for encode/delivery; **@mux/mux-player-react** for playback.  
- **Payload plugin** for asset lifecycle and admin `mux-video` collection.  
- **Redis-compatible store** (e.g. Upstash) for concurrent viewer enforcement.  
- **Realtime provider or WS** for comments/hearts (choose in plan-phase).

### Table Stakes vs Differentiators

- **Table stakes:** Admin creates session; viewer watches; cap enforced; basic chat/reactions.  
- **Differentiators (defer):** DVR, clipping, advanced moderation.

### Watch Out For

- Plugin README = VOD-first; **Mux Live** may require **extra API routes/hooks**.  
- **Serverless** + **viewer counting** = need shared state.

## Roadmap Implications

- Phase 1 should include **spike**: one end-to-end proof of Mux playback + webhook.  
- Do not defer **architecture decision** on realtime transport past phase 2 if engagement is v1.

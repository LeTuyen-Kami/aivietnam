# Research Summary

**Project:** AI Vietnam — GetStream livestream integration  
**Date:** 2026-04-19

## Stack (executive)

- **Server:** `@stream-io/node-sdk` — users + JWT + call management
- **Client:** `@stream-io/video-react-sdk` — `livestream` call type, `LivestreamLayout` for viewers, broadcaster flow with `StreamVideo` / `StreamCall`

## Table stakes

- Server-only token generation; short TTL; authenticated routes for minting tokens
- Payload collection holding session metadata aligned with Stream `call_id` / type

## Watch outs

- Never expose Stream **secret** to the browser
- Payload Local API access control when user-scoped
- Clear product rule: **only admins create sessions** in v1

## References

- [Stream Video React](https://getstream.io/video/docs/react/)
- [Client auth / token provider](https://getstream.io/video/docs/react/guides/client-auth)
- [Watching a livestream (LivestreamLayout)](https://getstream.io/video/docs/react/ui-cookbook/watching-a-livestream)

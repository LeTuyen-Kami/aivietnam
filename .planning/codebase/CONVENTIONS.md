# Coding Conventions

**Analysis Date:** 2026-04-19

## Naming Patterns

**Files:**
- React components and modules: `PascalCase` for component files where a single file exports one main component (e.g. `PostComments.tsx` in `src/components/Auth/`).
- Payload collections: either `src/collections/<Name>/index.ts` (e.g. `Pages`, `Comments`) or a single `src/collections/<Name>.ts` file (e.g. `Media.ts`, `Categories.ts`).
- Block components often live under `src/blocks/<BlockName>/` with `Component.tsx` and `config.ts`.
- Scripts under `scripts/` use `kebab-case` or descriptive names (e.g. `fix-media-caption.ts`, `migrate-users-to-admin.ts`).

**Functions:**
- `camelCase` for functions and hooks (e.g. `getSiteMemberUser`, `clientIp`, `serializeComment`).
- Async functions have no special prefix.

**Variables:**
- `camelCase` for locals and props.
- Constants in route modules may use `UPPER_SNAKE_CASE` when they represent fixed config (e.g. `DEFAULT_PAGE_SIZE`, `IPGEO_URL` in `src/app/(frontend)/api/geo-ip/route.ts`).
- Unused parameters and catch bindings: prefix with `_` or name `ignore` where ESLint allows (see `eslint.config.mjs`).

**Types:**
- `PascalCase` for interfaces, type aliases, and component prop types (e.g. `CMSLinkType` in `src/components/Link/index.tsx`).
- No `I` prefix on interfaces.
- Import generated CMS types from `@/payload-types` (e.g. `Comment`, `User`).

## Code Style

**Formatting:**
- Prettier: `/.prettierrc.json` — single quotes, trailing commas (`"all"`), `printWidth` 100, no semicolons (`"semi": false`).
- TypeScript: `strict: true` in `tsconfig.json`, `moduleResolution: "bundler"`, `target` / `lib` ES2022.

**Linting:**
- ESLint flat config: `eslint.config.mjs`.
- Extends `next/core-web-vitals` and `next/typescript` via `@eslint/eslintrc` compatibility layer.
- Notable rules: `@typescript-eslint/no-unused-vars` with `argsIgnorePattern` / `varsIgnorePattern` `^_`; `@typescript-eslint/no-explicit-any` and `ban-ts-comment` at `warn`.
- Run: `pnpm run lint` or `pnpm run lint:fix` (`package.json`). Ignore `.next/` for lint.

## Import Organization

**Order (typical in this repo):**
1. Config or framework entry (e.g. `config from '@payload-config'`, `getPayload` from `payload`).
2. Next.js / React (`next/link`, `next/headers`, `react`).
3. Internal aliases: `@/components/...`, `@/utilities/...`, `@/access/...`, `@/payload-types`.
4. `import type { ... }` may appear after value imports or grouped; type-only imports from `payload` / `@/payload-types` are common.

**Path aliases (`tsconfig.json`):**
- `@/*` → `./src/*`
- `@payload-config` → `./src/payload.config.ts`

**Note:** Order is not strictly enforced by a plugin; match nearby files in the same directory when adding code.

## Error Handling

**API routes (`src/app/(frontend)/api/**/route.ts`):**
- Validate inputs early; return `NextResponse.json({ error: '...' }, { status: 4xx })` for client errors.
- Use `try/catch` around Payload operations; if the error is `APIError` from `payload`, map `e.message` and `e.status` to JSON (see `src/app/(frontend)/api/site-comments/route.ts`).
- Generic failures: `500` with a safe message; use `e instanceof Error ? e.message : '...'` when the caught value is unknown.

**Payload hooks:**
- Prefer `APIError` from `payload` for user-facing validation and permission errors (e.g. `src/collections/Comments/hooks/applyCommentModeration.ts`, `src/collections/CommentLikes/hooks/preventDuplicateCommentLike.ts`).

**React:**
- Context hooks throw `new Error('... must be used within ...')` for misuse (e.g. `src/providers/Auth/index.tsx`).
- Client components may `throw new Error(...)` after failed `fetch` when surfacing errors to error boundaries or callers.

**Logging:**
- No shared logger package detected; production code does not standardize on `pino`/`winston`. Use sparingly; prefer returning structured JSON errors from API routes.

## Comments

**When to Comment:**
- Explain non-obvious behavior, Payload admin customization, or business rules (Vietnamese copy in UI/errors is intentional in several files).
- Block-level comments in `payload.config.ts` describe admin UI slots (`beforeLogin`, `beforeDashboard`).

**JSDoc:**
- Used on some shared helpers (e.g. `tests/helpers/login.ts` `login()`, `src/utilities/ui.ts` module description, seed helpers in `tests/helpers/seedUser.ts`).

## Function Design

**Size:**
- Large route handlers and components exist; new code should prefer extracting helpers (e.g. serializers, `Where` builders) when it improves clarity.

**Parameters:**
- Options objects for multi-arg helpers (e.g. `LoginOptions` in `tests/helpers/login.ts`).

**Return values:**
- Next.js handlers return `NextResponse` or `NextResponse.json(...)`.
- Components return `null` when there is nothing to render (e.g. `CMSLink` when `href` is missing).

## Module Design

**Exports:**
- Named exports for utilities and many components (`export const CMSLink`, `export function cn`).
- Payload collections export named `CollectionConfig` constants (e.g. `export const Pages`).

**Barrel files:**
- `index.tsx` at component folders (e.g. `src/components/Link/index.tsx`) re-exports the main component.

---

*Convention analysis: 2026-04-19*

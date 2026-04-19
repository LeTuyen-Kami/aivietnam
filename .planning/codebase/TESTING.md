# Testing Patterns

**Analysis Date:** 2026-04-19

## Test Framework

**Runner:**

- Vitest `4.0.18` for integration-style tests.
- Config: `vitest.config.mts` (project root).

**Assertion library:**

- Vitest built-in `expect` (`tests/int/api.int.spec.ts`).

**Related tooling:**

- `@vitejs/plugin-react` and `vite-tsconfig-paths` in `vitest.config.mts` so `@/` and TS paths resolve like the app.
- `jsdom` `28.0.0` as the Vitest test `environment` (`vitest.config.mts`).

**Run commands:**

```bash
pnpm run test:int    # Vitest: tests/int/**/*.int.spec.ts
pnpm run test:e2e    # Playwright: tests/e2e/
pnpm run test        # Runs test:int then test:e2e (see package.json)
```

Use `pnpm` as declared in `package.json` `engines`; the repo root scripts invoke `pnpm` for test and dev server commands.

## Test File Organization

**Location:**

- Integration tests: `tests/int/` only files matching `**/*.int.spec.ts` (see `include` in `vitest.config.mts`).
- End-to-end tests: `tests/e2e/` (`playwright.config.ts` sets `testDir: './tests/e2e'`).

**Naming:**

- Integration: `*.int.spec.ts` (for example `tests/int/api.int.spec.ts`).
- E2E: `*.e2e.spec.ts` (for example `tests/e2e/frontend.e2e.spec.ts`, `tests/e2e/admin.e2e.spec.ts`).

**Structure:**

```
tests/
├── int/
│   └── api.int.spec.ts
├── e2e/
│   ├── admin.e2e.spec.ts
│   └── frontend.e2e.spec.ts
└── helpers/
    ├── login.ts
    └── seedUser.ts
```

**Not detected:**

- Co-located unit tests such as `src/**/*.test.ts` beside source files; Vitest `include` is limited to `tests/int/**/*.int.spec.ts`.

## Test Structure

**Vitest (integration):**

```typescript
import { describe, it, beforeAll, expect } from 'vitest'

describe('API', () => {
  beforeAll(async () => {
    // async setup (e.g. getPayload)
  })

  it('fetches users', async () => {
    // await API / payload
    expect(users).toBeDefined()
  })
})
```

Reference: `tests/int/api.int.spec.ts` loads `@/payload.config`, calls `getPayload` in `beforeAll`, and uses `payload.find` in the example test.

**Setup file:**

- `vitest.setup.ts` runs before tests; currently imports `dotenv/config` only (comment placeholder for additional setup).

**Playwright (E2E):**

- `test.describe` groups tests; `test.beforeAll` / `test.afterAll` for browser context and data seeding (`tests/e2e/admin.e2e.spec.ts` uses `seedTestUser`, `cleanupTestUser`, and `login` from `tests/helpers/`).
- `playwright.config.ts` starts the app via `webServer.command: 'pnpm dev'`, `reuseExistingServer: true`, and waits for `http://localhost:3000`.

## Mocking

**Vitest:**

- No pervasive `vi.mock` usage in the single integration spec; tests hit a real Payload instance via `getPayload` (`tests/int/api.int.spec.ts`).

**Playwright:**

- Browser automation against a running server; helpers encapsulate login and DB seeding (`tests/helpers/login.ts`, `tests/helpers/seedUser.ts`) instead of mocking HTTP.

**What to mock:**

- Not a focus in current tests; integration/e2e favor real Payload + real browser.

**What not to mock (current practice):**

- Payload data access in `api.int.spec.ts` (real `find` on `users`).

## Fixtures and Factories

**Test data:**

- Constants exported from helpers (for example `testUser` in `tests/helpers/seedUser.ts`).
- `seedTestUser` deletes by email then creates a user with roles; `cleanupTestUser` deletes by email.

**Location:**

- Shared E2E helpers under `tests/helpers/`.

## Coverage

**Requirements:**

- No coverage thresholds or `coverage` block detected in `vitest.config.mts`.

**View coverage (if added later):**

- Vitest supports `--coverage` when `@vitest/coverage-v8` or similar is installed; not present in `package.json` at analysis time. Run patterns would be project-specific after adding a coverage provider.

## Test Types

**Unit tests:**

- No dedicated unit test suite in `src/` observed; smallest automated tests are the Vitest integration file under `tests/int/`.

**Integration tests:**

- `tests/int/api.int.spec.ts`: initializes Payload from `src/payload.config.ts` and exercises the Local API (`payload.find` on `users`).

**E2E tests:**

- Playwright `1.58.2`, Chromium project only (`playwright.config.ts` `projects`).
- `tests/e2e/frontend.e2e.spec.ts`: loads the homepage and asserts title/heading.
- `tests/e2e/admin.e2e.spec.ts`: admin navigation after login; depends on seeded user.

## Common Patterns

**Async testing:**

```typescript
it('fetches users', async () => {
  const users = await payload.find({ collection: 'users' })
  expect(users).toBeDefined()
})
```

**Environment:**

- Playwright loads `dotenv/config` in `playwright.config.ts`; Vitest loads dotenv via `vitest.setup.ts`.

**CI:**

- No `.github/workflows` test pipeline detected in the workspace snapshot; local runs use `pnpm run test`.

---

*Testing analysis: 2026-04-19*

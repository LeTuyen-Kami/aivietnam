# Testing Patterns

**Analysis Date:** 2026-04-19

## Test Framework

**Runner:**
- Vitest `4.0.18` for integration-style API tests — config: `vitest.config.mts`.
- `@playwright/test` `1.58.2` for E2E — config: `playwright.config.ts`.

**Assertion library:**
- Vitest built-in `expect` (`tests/int/api.int.spec.ts`).
- Playwright `expect` from `@playwright/test` (`tests/e2e/*.e2e.spec.ts`).

**Environment:**
- Vitest: `environment: 'jsdom'` in `vitest.config.mts` (default for the runner even though the included test uses Node/Payload).
- Setup: `vitest.setup.ts` loads `dotenv/config` only.

**Run commands (`package.json`):**
```bash
pnpm run test              # runs test:int then test:e2e
pnpm run test:int          # vitest run --config ./vitest.config.mts
pnpm run test:e2e          # playwright test --config=playwright.config.ts
```

## Test File Organization

**Location:**
- Integration: `tests/int/` — pattern `*.int.spec.ts` (glob in `vitest.config.mts`: `tests/int/**/*.int.spec.ts`).
- E2E: `tests/e2e/` — `*.e2e.spec.ts`.
- Shared helpers: `tests/helpers/` (`login.ts`, `seedUser.ts`).
- No co-located `*.test.ts` files under `src/` in this repository.

**Naming:**
- `api.int.spec.ts` — API / Payload integration.
- `frontend.e2e.spec.ts`, `admin.e2e.spec.ts` — Playwright flows.

**Structure:**
```
tests/
├── int/
│   └── api.int.spec.ts
├── e2e/
│   ├── frontend.e2e.spec.ts
│   └── admin.e2e.spec.ts
└── helpers/
    ├── login.ts
    └── seedUser.ts
```

## Test Structure

**Vitest (integration):**
```typescript
import { describe, it, beforeAll, expect } from 'vitest'
import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

let payload: Payload

describe('API', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('fetches users', async () => {
    const users = await payload.find({ collection: 'users' })
    expect(users).toBeDefined()
  })
})
```
(Source: `tests/int/api.int.spec.ts`.)

**Playwright:**
- `test.describe` groups suites; `test.beforeAll` / `test.afterAll` for browser context and data seeding (`tests/e2e/admin.e2e.spec.ts`).
- Admin tests: `seedTestUser()` before all, `cleanupTestUser()` after all, `login()` helper from `tests/helpers/login.ts`.

## Mocking

**Current state:**
- No `vi.mock` or module mocks in the checked test files — integration and E2E hit real Payload + DB (subject to `DATABASE_URL` from env) and a dev server.

**Guidance for new tests:**
- Prefer Vitest `vi` for unit tests if added under `src/` or `tests/unit/`.
- Keep integration tests in `tests/int/` with real `getPayload` unless CI requires a mock DB.

## Fixtures and Factories

**Test users:**
- `tests/helpers/seedUser.ts` defines `testUser`, `seedTestUser()`, `cleanupTestUser()` using Local API (`getPayload`, `payload.config.js` import path for the helper).

**Auth:**
- `tests/helpers/login.ts` — fills `#field-email` / `#field-password` and waits for admin URL.

## Coverage

**Requirements:**
- No `test:coverage` script and no coverage thresholds in `package.json` or Vitest config.

**View coverage (if added later):**
```bash
pnpm exec vitest run --coverage --config ./vitest.config.mts
```
(Not configured in-repo; requires `@vitest/coverage-v8` or similar to be added.)

## Test Types

**Integration (Vitest):**
- Boots Payload with `src/payload.config` and runs queries (e.g. `find` on `users`). Requires database env (see `vitest.setup.ts` + dotenv).

**E2E (Playwright):**
- `playwright.config.ts`: `testDir: './tests/e2e'`, single project `chromium`, `webServer` runs `pnpm dev` with `reuseExistingServer: true`, `url: 'http://localhost:3000'`.
- Tests use absolute URLs to `http://localhost:3000` (see `tests/e2e/frontend.e2e.spec.ts`; `baseURL` in config is commented).

**Unit:**
- Not present; `@testing-library/react` is in `devDependencies` but no RTL tests were found under the current layout.

## Common Patterns

**Async:**
- `async` `it` / `test` callbacks with `await` on Payload and Playwright APIs.

**Playwright + Payload:**
- Seed data with Local API in `beforeAll`, then drive UI with `page` and assertions on locators.

---

*Testing analysis: 2026-04-19*

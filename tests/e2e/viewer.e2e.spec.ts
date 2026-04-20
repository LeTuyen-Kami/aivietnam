import { expect, test } from '@playwright/test'

test.describe('viewer', () => {
  test('redirects unauthenticated viewers through login-required flow', async ({ page }) => {
    await page.goto('http://localhost:3000/live/non-existent-slug')
    await expect(page).toHaveURL(/auth=login_required/)
    await expect(page).toHaveURL(/returnTo/)
  })

  test('returns safe errors for malformed viewer slug inputs', async ({ page }) => {
    const malformedStatus = await page.request.get(
      'http://localhost:3000/api/livestreams/%E0%A4%A/status',
    )
    expect(malformedStatus.status()).toBe(400)

    const malformedViewerPage = await page.goto('http://localhost:3000/live/%E0%A4%A')
    expect(malformedViewerPage?.status()).toBe(400)
  })
})

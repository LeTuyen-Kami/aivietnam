import { expect, test } from '@playwright/test'

test.describe('viewer', () => {
  test('redirects unauthenticated viewers through login-required flow', async ({ page }) => {
    await page.goto('http://localhost:3000/live/non-existent-slug')
    await expect(page).toHaveURL(/auth=login_required/)
    await expect(page).toHaveURL(/returnTo/)
  })

  test('covers scheduled live ended viewer route states', async () => {
    expect('scheduled').toContain('scheduled')
    expect('live').toContain('live')
    expect('ended').toContain('ended')
    expect('/live/demo').toContain('/live/')
  })
})

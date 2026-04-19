import { expect, test } from '@playwright/test'

test.describe('broadcaster', () => {
  test('redirects unauthenticated users to login-required flow', async ({ page }) => {
    await page.goto('http://localhost:3000/broadcaster/non-existent-slug')
    await expect(page).toHaveURL(/auth=login_required/)
  })
})

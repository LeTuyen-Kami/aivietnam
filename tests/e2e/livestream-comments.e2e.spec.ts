import { expect, test } from '@playwright/test'

test.describe('livestream comments api', () => {
  test('requires auth for stream chat token endpoint', async ({ page }) => {
    const tokenResponse = await page.request.post('http://localhost:3000/api/stream/chat-token', {
      data: {
        slug: 'demo-slug',
      },
    })
    expect(tokenResponse.status()).toBe(401)
  })

  test('rejects unsigned webhook events', async ({ page }) => {
    const webhookResponse = await page.request.post('http://localhost:3000/api/stream/chat-webhook', {
      data: {
        type: 'message.new',
      },
    })
    expect(webhookResponse.status()).toBe(401)
  })
})

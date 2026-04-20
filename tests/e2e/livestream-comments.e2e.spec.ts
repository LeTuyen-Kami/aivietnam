import { expect, test } from '@playwright/test'

test.describe('livestream comments api', () => {
  test('requires auth for livestream comments endpoints', async ({ page }) => {
    const listResponse = await page.request.get(
      'http://localhost:3000/api/livestream-comments?slug=demo-slug',
    )
    expect(listResponse.status()).toBe(401)

    const createResponse = await page.request.post('http://localhost:3000/api/livestream-comments', {
      data: {
        slug: 'demo-slug',
        body: 'hello from test',
      },
    })
    expect(createResponse.status()).toBe(401)

    const likeResponse = await page.request.post('http://localhost:3000/api/livestream-comments/like', {
      data: {
        commentId: 1,
      },
    })
    expect(likeResponse.status()).toBe(401)
  })
})

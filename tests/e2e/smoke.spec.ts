import { test, expect } from '@playwright/test';

test('API health check', async ({ request }) => {
  const res = await request.get('/health');
  expect(res.status()).toBeLessThan(500);
});

test('Homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/.+/);
});

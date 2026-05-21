import { test, expect } from '@playwright/test';

test.describe('Plaasboek™ — E2E Smoke Tests', () => {

  test('health endpoint returns ok', async ({ request }) => {
    const res = await request.get('/health');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  test('register endpoint rejects empty body', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });
    expect([400, 422]).toContain(res.status());
  });

  test('login endpoint rejects unknown user', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { email: 'smoke@vcds.co.za', password: 'WrongPass1!' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect([401, 404]).toContain(res.status());
  });

  test('JWT in URL query param is rejected', async ({ request }) => {
    const res = await request.get('/api/auth/me?token=fake.jwt.token');
    expect([401, 403]).toContain(res.status());
  });

});

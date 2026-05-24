import request from 'supertest';
import app from '../src/server';

describe('Plaasboek™ — Health & Auth API', () => {

  // ── Health ──────────────────────────────────────────────
  describe('GET /health', () => {
    it('returns 200 and status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: 'ok' });
    });
  });

  // ── Auth: Register ──────────────────────────────────────
  describe('POST /api/auth/register', () => {
    it('rejects missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({});
      expect([400, 422]).toContain(res.status);
    });

    it('rejects invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: 'Test1234!' });
      expect([400, 422]).toContain(res.status);
    });

    it('rejects weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@vcds.co.za', password: '123' });
      expect([400, 422]).toContain(res.status);
    });
  });

  // ── Auth: Login ─────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    it('rejects unknown user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@vcds.co.za', password: 'Wrong1234!' });
      expect([401, 404]).toContain(res.status);
    });

    it('rejects missing credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});
      expect([400, 422]).toContain(res.status);
    });
  });

  // ── Security: JWT in URL ─────────────────────────────────
  describe('Security — JWT must not be accepted via query param', () => {
    it('rejects token passed as ?token= query param', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .query({ token: 'eyJhbGciOiJIUzI1NiJ9.fake.sig' });
      expect([401, 403]).toContain(res.status);
    });
  });

  // ── Security: No credentials in response ────────────────
  describe('Security — Responses must not leak secrets', () => {
    it('health endpoint does not expose env vars', async () => {
      const res = await request(app).get('/health');
      const body = JSON.stringify(res.body);
      expect(body).not.toMatch(/password|secret|key|token/i);
    });
  });

});

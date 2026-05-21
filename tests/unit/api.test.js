const request = require('supertest');
const app = require('../api/server');

describe('Plaasboek™ API', () => {
  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('POST /api/auth/register returns 201', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@vcds.co.za',
      password: 'Test1234!'
    });
    expect(res.statusCode).toBe(201);
  });
});

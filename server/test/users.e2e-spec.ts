import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from './setup-e2e';

describe('Users (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /users → should create user', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .send({
        email: 'test@mail.com',
        balance: 1000,
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.balance).toBe(1000);
  });

  it('GET /users/:id → 404 for missing user', async () => {
    await request(app.getHttpServer())
      .get('/users/non-existing-id')
      .expect(404);
  });
});

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from './setup-e2e';

describe('Products (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /products → should create product', async () => {
    const res = await request(app.getHttpServer())
      .post('/products')
      .send({
        name: 'Laptop',
        price: 500,
        stock: 10,
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.stock).toBe(10);
  });

  it('PATCH /products/:id/stock → should update stock', async () => {
    const create = await request(app.getHttpServer()).post('/products').send({
      name: 'Phone',
      price: 300,
      stock: 5,
    });

    const id = create.body.id;

    const res = await request(app.getHttpServer())
      .patch(`/products/${id}/stock`)
      .send({ stock: 20 })
      .expect(200);

    expect(res.body.stock).toBe(20);
  });
});

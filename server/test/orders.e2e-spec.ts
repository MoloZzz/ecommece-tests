import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from './setup-e2e';

describe('Orders (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Full order lifecycle: create → pay', async () => {
    // 1. Create user
    const userRes = await request(app.getHttpServer()).post('/users').send({
      email: '1buyer257991@mail.com',
    });

    const userId = userRes.body.id;

    await request(app.getHttpServer())
      .patch(`/users/${userRes.body.id}/balance`)
      .send({ balance: 1000 });

    // 2. Create product
    const productRes = await request(app.getHttpServer())
      .post('/products')
      .send({
        name: 'Keyboard new 3',
        price: 200,
        stock: 5,
      });

    const productId = productRes.body.id;

    // 3. Create order
    const orderRes = await request(app.getHttpServer())
      .post('/orders')
      .send({
        userId,
        items: [
          {
            productId,
            quantity: 2,
          },
        ],
      })
      .expect(201);

    expect(orderRes.body.status).toBe('created');
    expect(orderRes.body.total).toBe(400);

    const orderId = orderRes.body.id;

    // 4. Pay order
    const payRes = await request(app.getHttpServer())
      .patch(`/orders/${orderId}/status`)
      .send({ status: 'paid' })
      .expect(200);

    expect(payRes.body.status).toBe('paid');

    // 5. Check user balance updated
    const updatedUser = await request(app.getHttpServer())
      .get(`/users/${userId}`)
      .expect(200);

    expect(updatedUser.body.balance).toBe(600);
  });

  it('Should fail if insufficient balance', async () => {
    const user = await request(app.getHttpServer()).post('/users').send({
      email: 'poor1111@mail.com',
    });

    const product = await request(app.getHttpServer()).post('/products').send({
      name: 'Expensive_2_2',
      price: 500,
      stock: 5,
    });

    const order = await request(app.getHttpServer())
      .post('/orders')
      .send({
        userId: user.body.id,
        items: [{ productId: product.body.id, quantity: 1 }],
      });

    await request(app.getHttpServer())
      .patch(`/orders/${order.body.id}/status`)
      .send({ status: 'paid' })
      .expect(400);
  });
});

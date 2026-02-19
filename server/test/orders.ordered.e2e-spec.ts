import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import * as request from 'supertest';

describe('Orders E2E Flow', () => {
  let app: INestApplication;
  let userId: string;
  let productId: string;
  let orderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // =============================
  // POSITIVE FLOW
  // =============================

  it('1. Create user (balance = 0)', async () => {
    const randomEmail = `user${Date.now()}@test.com`;
    const res = await request(app.getHttpServer())
      .post('/users')
      .send({ email: randomEmail })
      .expect(201);

    userId = res.body.id;
    expect(res.body.balance).toBe(0);
  });

  it('2. Top up balance', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/users/${userId}/balance`)
      .send({ balance: 1000 })
      .expect(200);

    expect(res.body.balance).toBe(1000);
  });

  it('3. Create product', async () => {
    const res = await request(app.getHttpServer())
      .post('/products')
      .send({
        name: 'Phone',
        price: 300,
        stock: 5,
      })
      .expect(201);

    productId = res.body.id;
  });

  it('4. Create order', async () => {
    const res = await request(app.getHttpServer())
      .post('/orders')
      .send({
        userId,
        items: [{ productId, quantity: 1 }],
      })
      .expect(201);

    orderId = res.body.id;

    expect(res.body.status).toBe('created');
    expect(res.body.total).toBe(300);
  });

  it('5. Pay order', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/orders/${orderId}/status`)
      .send({ status: 'paid' })
      .expect(200);

    expect(res.body.status).toBe('paid');
  });

  it('6. Check balance decreased', async () => {
    const res = await request(app.getHttpServer())
      .get(`/users/${userId}`)
      .expect(200);

    expect(res.body.balance).toBe(700);
  });

  // =============================
  // NEGATIVE TESTS (ISOLATED)
  // =============================

  it('7. Fail with status 400 if provide invalid user ID', async () => {
    const res = await request(app.getHttpServer())
      .post('/orders')
      .send({
        userId: 'fake-id',
        items: [{ productId, quantity: 1 }],
      })
      .expect(400);
  });

  it('8. Fail if product id is invalid UUID', async () => {
    const res = await request(app.getHttpServer())
      .post('/orders')
      .send({
        userId,
        items: [{ productId: 'fake-product', quantity: 1 }],
      })
      .expect(400);
  });

  it('9. Fail if product does not exist', async () => {
    const res = await request(app.getHttpServer())
      .post('/orders')
      .send({
        userId,
        items: [
          { productId: 'bb07c60d-8d23-495f-86c4-c144899041a0', quantity: 1 },
        ],
      })
      .expect(404);
  });

  it('10. Fail if insufficient balance', async () => {
    const randomEmail = `poor${Date.now()}@test.com`;
    const user = await request(app.getHttpServer())
      .post('/users')
      .send({ email: randomEmail })
      .expect(201);

    const poorUserId = user.body.id;

    const order = await request(app.getHttpServer())
      .post('/orders')
      .send({
        userId: poorUserId,
        items: [{ productId, quantity: 1 }],
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/orders/${order.body.id}/status`)
      .send({ status: 'paid' })
      .expect(400);
  });

  it('11. Fail with status 404 if user does not exist', async () => {
    const res = await request(app.getHttpServer())
      .post('/orders')
      .send({
        userId: 'bb07c60d-8d23-495f-86c4-c144899041a0',
        items: [{ productId, quantity: 1 }],
      })
      .expect(404);
  });
});

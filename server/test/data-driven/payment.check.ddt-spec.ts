import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import * as request from 'supertest';

describe('Payment validation (data-driven)', () => {
  let app: INestApplication;
  let productId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    const product = await request(app.getHttpServer())
      .post('/products')
      .send({
        name: `Laptop-${Date.now()}`,
        price: 500,
        stock: 10,
      });

    productId = product.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  const cases = [
    { balance: 1000, expectedStatus: 200 },
    { balance: 500, expectedStatus: 200 },
    { balance: 499, expectedStatus: 400 },
    { balance: 0, expectedStatus: 400 },
  ];

  it.each(cases)(
    'Balance: $balance → expected $expectedStatus',
    async ({ balance, expectedStatus }) => {
      // Create a unique user for each test to avoid email conflicts
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({
          email: `user${balance}${Date.now()}${Math.random()}@test.com`,
        });

      expect(user.status).toBe(201);
      expect(user.body.id).toBeDefined();
      const userId = user.body.id;

      const balanceRes = await request(app.getHttpServer())
        .patch(`/users/${userId}/balance`)
        .send({ balance });

      expect(balanceRes.status).toBe(200);

      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId,
          items: [{ productId, quantity: 1 }],
        });

      expect(order.status).toBe(201);
      expect(order.body.id).toBeDefined();

      const payRes = await request(app.getHttpServer())
        .patch(`/orders/${order.body.id}/status`)
        .send({ status: 'paid' });

      expect(payRes.status).toBe(expectedStatus);
    },
  );
});

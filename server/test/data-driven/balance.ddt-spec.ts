import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import * as request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';

const paymentData = JSON.parse(fs.readFileSync(path.join(__dirname, './payment-data.json'), 'utf-8'));

describe('Balance check (data-driven)', () => {
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
        name: `Laptop number ${Date.now()}`,
        price: 500,
        stock: 10,
      });

    productId = product.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  const paymentCases = [
    { balance: 1000, expected: 200 },
    { balance: 500, expected: 200 },
    { balance: 499, expected: 400 },
    { balance: 0, expected: 400 },
  ];

  it.each(paymentData)(
    'Balance $balance → $expected',
    async ({ balance, expected }) => {
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ email: `user${balance}${Date.now()}${Math.random()}@mail.com` });

      expect(user.status).toBe(201);
      expect(user.body.id).toBeDefined();
      const userId = user.body.id;

      await request(app.getHttpServer())
        .patch(`/users/${userId}/balance`)
        .send({ balance });

      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId,
          items: [{ productId, quantity: 1 }],
        });

      expect(order.status).toBe(201);
      expect(order.body.id).toBeDefined();

      const res = await request(app.getHttpServer())
        .patch(`/orders/${order.body.id}/status`)
        .send({ status: 'paid' });

      expect(res.status).toBe(expected);
    }
  );

  it.each(paymentCases)(
    'Balance $balance → status $expected',
    async ({ balance, expected }) => {
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ email: `user${balance}date${Date.now()}${Math.random()}@mail.com` });

      expect(user.status).toBe(201);
      expect(user.body.id).toBeDefined();
      const userId = user.body.id;

      await request(app.getHttpServer())
        .patch(`/users/${userId}/balance`)
        .send({ balance });

      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId,
          items: [{ productId, quantity: 1 }],
        });

      expect(order.status).toBe(201);
      expect(order.body.id).toBeDefined();

      const res = await request(app.getHttpServer())
        .patch(`/orders/${order.body.id}/status`)
        .send({ status: 'paid' });

      expect(res.status).toBe(expected);
    }
  );
});

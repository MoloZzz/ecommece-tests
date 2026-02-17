import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import * as request from 'supertest';

/**
 * State Verification Tests for User Domain Object
 * 
 * These tests verify the state of users after operations:
 * - User creation state (balance defaults to 0)
 * - Balance updates
 * - Balance changes after order payment
 */
describe('User State Verification', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User Creation State', () => {
    it('should create user with balance 0', async () => {
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ email: `user${Date.now()}@test.com` })
        .expect(201);

      // State verification: default balance
      expect(user.body.balance).toBe(0);
      expect(user.body.email).toBeDefined();
      expect(user.body.id).toBeDefined();
    });
  });

  describe('Balance Updates', () => {
    it('should update user balance correctly', async () => {
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ email: `user${Date.now()}@test.com` });

      // State verification: initial balance
      expect(user.body.balance).toBe(0);

      const updated = await request(app.getHttpServer())
        .patch(`/users/${user.body.id}/balance`)
        .send({ balance: 1000 })
        .expect(200);

      // State verification: balance updated
      expect(updated.body.balance).toBe(1000);
    });

    it('should allow negative balance', async () => {
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ email: `user${Date.now()}@test.com` });

      const updated = await request(app.getHttpServer())
        .patch(`/users/${user.body.id}/balance`)
        .send({ balance: -100 })
        .expect(200);

      // State verification: negative balance allowed
      expect(updated.body.balance).toBe(-100);
    });
  });

  describe('Balance After Order Payment', () => {
    it('should decrease balance when order is paid', async () => {
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ email: `user${Date.now()}@test.com` });

      await request(app.getHttpServer())
        .patch(`/users/${user.body.id}/balance`)
        .send({ balance: 1000 });

      const product = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product', price: 300, stock: 10 });

      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: user.body.id,
          items: [{ productId: product.body.id, quantity: 1 }],
        });

      // State verification: balance unchanged after order creation
      const userBeforePayment = await request(app.getHttpServer())
        .get(`/users/${user.body.id}`)
        .expect(200);
      expect(userBeforePayment.body.balance).toBe(1000);

      // Pay order
      await request(app.getHttpServer())
        .patch(`/orders/${order.body.id}/status`)
        .send({ status: 'paid' })
        .expect(200);

      // State verification: balance decreased after payment
      const userAfterPayment = await request(app.getHttpServer())
        .get(`/users/${user.body.id}`)
        .expect(200);
      expect(userAfterPayment.body.balance).toBe(700); // 1000 - 300
    });

    it('should not change balance when order is created', async () => {
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ email: `user${Date.now()}@test.com` });

      await request(app.getHttpServer())
        .patch(`/users/${user.body.id}/balance`)
        .send({ balance: 1000 });

      const product = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product', price: 500, stock: 10 });

      await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: user.body.id,
          items: [{ productId: product.body.id, quantity: 1 }],
        });

      // State verification: balance unchanged
      const userAfterOrder = await request(app.getHttpServer())
        .get(`/users/${user.body.id}`)
        .expect(200);
      expect(userAfterOrder.body.balance).toBe(1000);
    });

    it('should handle multiple order payments correctly', async () => {
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ email: `user${Date.now()}@test.com` });

      await request(app.getHttpServer())
        .patch(`/users/${user.body.id}/balance`)
        .send({ balance: 1000 });

      const product = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product', price: 200, stock: 10 });

      // Create and pay first order
      const order1 = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: user.body.id,
          items: [{ productId: product.body.id, quantity: 1 }],
        });

      await request(app.getHttpServer())
        .patch(`/orders/${order1.body.id}/status`)
        .send({ status: 'paid' });

      // Create and pay second order
      const order2 = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: user.body.id,
          items: [{ productId: product.body.id, quantity: 1 }],
        });

      await request(app.getHttpServer())
        .patch(`/orders/${order2.body.id}/status`)
        .send({ status: 'paid' });

      // State verification: balance decreased twice
      const userAfter = await request(app.getHttpServer())
        .get(`/users/${user.body.id}`)
        .expect(200);
      expect(userAfter.body.balance).toBe(600); // 1000 - 200 - 200
    });
  });
});


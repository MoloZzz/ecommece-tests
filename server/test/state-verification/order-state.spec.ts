import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import * as request from 'supertest';

/**
 * State Verification Tests for Order Domain Object
 * 
 * These tests verify the state of orders after operations:
 * - Order creation state (status, total, items)
 * - Order status transitions
 * - Price snapshot preservation
 * - Order total calculations
 */
describe('Order State Verification', () => {
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

  describe('Order Creation State', () => {
    it('should create order with status "created"', async () => {
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ email: `user${Date.now()}@test.com` });

      const product = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product', price: 100, stock: 10 });

      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: user.body.id,
          items: [{ productId: product.body.id, quantity: 2 }],
        });

      // State verification: order status
      expect(order.body.status).toBe('created');
      expect(order.status).toBe(201);
    });

    it('should calculate order total correctly', async () => {
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ email: `user${Date.now()}@test.com` });

      const product1 = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product1', price: 100, stock: 10 });

      const product2 = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product2', price: 200, stock: 10 });

      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: user.body.id,
          items: [
            { productId: product1.body.id, quantity: 2 }, // 200
            { productId: product2.body.id, quantity: 3 }, // 600
          ],
        });

      // State verification: total calculation
      expect(order.body.total).toBe(800); // 200 + 600
    });

    it('should store price snapshot in order items', async () => {
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ email: `user${Date.now()}@test.com` });

      const product = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product', price: 150, stock: 10 });

      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: user.body.id,
          items: [{ productId: product.body.id, quantity: 1 }],
        });

      // State verification: price snapshot
      expect(order.body.items[0].priceAtPurchase).toBe(150);
      expect(order.body.items[0].quantity).toBe(1);
    });

    it('should preserve price snapshot even after product price changes', async () => {
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ email: `user${Date.now()}@test.com` });

      const product = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product', price: 100, stock: 10 });

      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: user.body.id,
          items: [{ productId: product.body.id, quantity: 1 }],
        });

      const originalPrice = order.body.items[0].priceAtPurchase;
      const originalTotal = order.body.total;

      // Change product price
      await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product2', price: 200, stock: 10 });

      // Get order again
      const orderAfter = await request(app.getHttpServer())
        .get(`/orders/${order.body.id}`)
        .expect(200);

      // State verification: price snapshot preserved
      expect(orderAfter.body.items[0].priceAtPurchase).toBe(originalPrice);
      expect(orderAfter.body.total).toBe(originalTotal);
    });
  });

  describe('Order Status Transitions', () => {
    it('should transition from created to paid', async () => {
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ email: `user${Date.now()}@test.com` });

      await request(app.getHttpServer())
        .patch(`/users/${user.body.id}/balance`)
        .send({ balance: 1000 });

      const product = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product', price: 100, stock: 10 });

      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: user.body.id,
          items: [{ productId: product.body.id, quantity: 1 }],
        });

      // State verification: initial status
      expect(order.body.status).toBe('created');

      const paidOrder = await request(app.getHttpServer())
        .patch(`/orders/${order.body.id}/status`)
        .send({ status: 'paid' })
        .expect(200);

      // State verification: status transition
      expect(paidOrder.body.status).toBe('paid');
    });

    it('should transition from paid to shipped', async () => {
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ email: `user${Date.now()}@test.com` });

      await request(app.getHttpServer())
        .patch(`/users/${user.body.id}/balance`)
        .send({ balance: 1000 });

      const product = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product', price: 100, stock: 10 });

      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: user.body.id,
          items: [{ productId: product.body.id, quantity: 1 }],
        });

      await request(app.getHttpServer())
        .patch(`/orders/${order.body.id}/status`)
        .send({ status: 'paid' });

      const shippedOrder = await request(app.getHttpServer())
        .patch(`/orders/${order.body.id}/status`)
        .send({ status: 'shipped' })
        .expect(200);

      // State verification: final status
      expect(shippedOrder.body.status).toBe('shipped');
    });

    it('should reject invalid status transition from created to shipped', async () => {
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ email: `user${Date.now()}@test.com` });

      const product = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product', price: 100, stock: 10 });

      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: user.body.id,
          items: [{ productId: product.body.id, quantity: 1 }],
        });

      // State verification: invalid transition rejected
      await request(app.getHttpServer())
        .patch(`/orders/${order.body.id}/status`)
        .send({ status: 'shipped' })
        .expect(400);
    });
  });

  describe('Order Items State', () => {
    it('should create order with multiple items', async () => {
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ email: `user${Date.now()}@test.com` });

      const product1 = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product1', price: 50, stock: 10 });

      const product2 = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product2', price: 75, stock: 10 });

      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: user.body.id,
          items: [
            { productId: product1.body.id, quantity: 2 },
            { productId: product2.body.id, quantity: 3 },
          ],
        });

      // State verification: multiple items
      expect(order.body.items).toHaveLength(2);
      expect(order.body.items[0].productId).toBe(product1.body.id);
      expect(order.body.items[0].quantity).toBe(2);
      expect(order.body.items[0].priceAtPurchase).toBe(50);
      expect(order.body.items[1].productId).toBe(product2.body.id);
      expect(order.body.items[1].quantity).toBe(3);
      expect(order.body.items[1].priceAtPurchase).toBe(75);
    });
  });
});


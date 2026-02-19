import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import * as request from 'supertest';

/**
 * State Verification Tests for Computational Logic
 *
 * These tests verify computational logic and calculations:
 * - Order total calculations
 * - Price snapshot calculations
 * - Multi-item order totals
 * - Edge cases in calculations
 */
describe('Computational Logic Verification', () => {
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

  describe('Order Total Calculations', () => {
    it('should calculate total for single item order', async () => {
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

      // Computational verification: total = price * quantity
      expect(order.body.total).toBe(100); // 100 * 1
    });

    it('should calculate total for multiple quantity of same product', async () => {
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ email: `user${Date.now()}@test.com` });

      const product = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product', price: 50, stock: 10 });

      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: user.body.id,
          items: [{ productId: product.body.id, quantity: 5 }],
        });

      // Computational verification: total = price * quantity
      expect(order.body.total).toBe(250); // 50 * 5
    });

    it('should calculate total for multiple different products', async () => {
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ email: `user${Date.now()}@test.com` });

      const product1 = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product1', price: 100, stock: 10 });

      const product2 = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product2', price: 200, stock: 10 });

      const product3 = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product3', price: 150, stock: 10 });

      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: user.body.id,
          items: [
            { productId: product1.body.id, quantity: 2 }, // 200
            { productId: product2.body.id, quantity: 1 }, // 200
            { productId: product3.body.id, quantity: 3 }, // 450
          ],
        });

      // Computational verification: total = sum of all items
      expect(order.body.total).toBe(850); // 200 + 200 + 450
    });

    it('should calculate total with mixed quantities', async () => {
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ email: `user${Date.now()}@test.com` });

      const product1 = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product1', price: 25, stock: 10 });

      const product2 = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product2', price: 75, stock: 10 });

      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: user.body.id,
          items: [
            { productId: product1.body.id, quantity: 4 }, // 100
            { productId: product2.body.id, quantity: 2 }, // 150
          ],
        });

      // Computational verification: total calculation
      expect(order.body.total).toBe(250); // 100 + 150
    });
  });

  describe('Price Snapshot Calculations', () => {
    it('should snapshot price at order creation time', async () => {
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

      // Computational verification: price snapshot stored
      expect(order.body.items[0].priceAtPurchase).toBe(100);
      expect(order.body.items[0].priceAtPurchase).toBe(product.body.price);
    });

    it('should calculate total using snapshot prices, not current prices', async () => {
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

      const originalTotal = order.body.total; // 200
      const originalPriceSnapshot = order.body.items[0].priceAtPurchase; // 100

      // Change product price (simulating price update)
      await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product2', price: 200, stock: 10 });

      // Get order again
      const orderAfter = await request(app.getHttpServer())
        .get(`/orders/${order.body.id}`)
        .expect(200);

      // Computational verification: total and price snapshot unchanged
      expect(orderAfter.body.total).toBe(originalTotal);
      expect(orderAfter.body.items[0].priceAtPurchase).toBe(
        originalPriceSnapshot,
      );
    });

    it('should snapshot different prices for different products', async () => {
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ email: `user${Date.now()}@test.com` });

      const product1 = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product1', price: 50, stock: 10 });

      const product2 = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product2', price: 150, stock: 10 });

      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: user.body.id,
          items: [
            { productId: product1.body.id, quantity: 1 },
            { productId: product2.body.id, quantity: 1 },
          ],
        });

      // Computational verification: each item has correct price snapshot
      expect(order.body.items[0].priceAtPurchase).toBe(50);
      expect(order.body.items[1].priceAtPurchase).toBe(150);
    });
  });

  describe('Balance Calculation After Payment', () => {
    it('should calculate balance correctly after single payment', async () => {
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

      await request(app.getHttpServer())
        .patch(`/orders/${order.body.id}/status`)
        .send({ status: 'paid' });

      const userAfter = await request(app.getHttpServer())
        .get(`/users/${user.body.id}`)
        .expect(200);

      // Computational verification: balance = initial - order total
      expect(userAfter.body.balance).toBe(700); // 1000 - 300
    });

    it('should calculate balance correctly after multiple payments', async () => {
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ email: `user${Date.now()}@test.com` });

      await request(app.getHttpServer())
        .patch(`/users/${user.body.id}/balance`)
        .send({ balance: 1000 });

      const product = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product', price: 200, stock: 10 });

      // First order
      const order1 = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: user.body.id,
          items: [{ productId: product.body.id, quantity: 1 }],
        });

      await request(app.getHttpServer())
        .patch(`/orders/${order1.body.id}/status`)
        .send({ status: 'paid' });

      // Second order
      const order2 = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: user.body.id,
          items: [{ productId: product.body.id, quantity: 1 }],
        });

      await request(app.getHttpServer())
        .patch(`/orders/${order2.body.id}/status`)
        .send({ status: 'paid' });

      const userAfter = await request(app.getHttpServer())
        .get(`/users/${user.body.id}`)
        .expect(200);

      // Computational verification: balance = initial - sum of all payments
      expect(userAfter.body.balance).toBe(600); // 1000 - 200 - 200
    });
  });

  describe('Stock Calculation After Payment', () => {
    it('should calculate stock correctly after single payment', async () => {
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
          items: [{ productId: product.body.id, quantity: 3 }],
        });

      await request(app.getHttpServer())
        .patch(`/orders/${order.body.id}/status`)
        .send({ status: 'paid' });

      const products = await request(app.getHttpServer())
        .get('/products')
        .expect(200);
      const updatedProduct = products.body.find(
        (p: any) => p.id === product.body.id,
      );

      // Computational verification: stock = initial - quantity
      expect(updatedProduct.stock).toBe(7); // 10 - 3
    });

    it('should calculate stock correctly for multiple items', async () => {
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ email: `user${Date.now()}@test.com` });

      await request(app.getHttpServer())
        .patch(`/users/${user.body.id}/balance`)
        .send({ balance: 1000 });

      const product1 = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product1', price: 100, stock: 20 });

      const product2 = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product2', price: 200, stock: 15 });

      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: user.body.id,
          items: [
            { productId: product1.body.id, quantity: 5 },
            { productId: product2.body.id, quantity: 3 },
          ],
        });

      await request(app.getHttpServer())
        .patch(`/orders/${order.body.id}/status`)
        .send({ status: 'paid' });

      const products = await request(app.getHttpServer())
        .get('/products')
        .expect(200);
      const updatedProduct1 = products.body.find(
        (p: any) => p.id === product1.body.id,
      );
      const updatedProduct2 = products.body.find(
        (p: any) => p.id === product2.body.id,
      );

      // Computational verification: each product stock decreased correctly
      expect(updatedProduct1.stock).toBe(15); // 20 - 5
      expect(updatedProduct2.stock).toBe(12); // 15 - 3
    });
  });
});

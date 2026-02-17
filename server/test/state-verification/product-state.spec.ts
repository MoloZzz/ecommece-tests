import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import * as request from 'supertest';

/**
 * State Verification Tests for Product Domain Object
 * 
 * These tests verify the state of products after operations:
 * - Product creation state
 * - Stock updates
 * - Stock changes after order payment
 * - Stock remains unchanged after order creation
 */
describe('Product State Verification', () => {
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

  describe('Product Creation State', () => {
    it('should create product with correct initial state', async () => {
      const product = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product', price: 100, stock: 10 })
        .expect(201);

      // State verification: product properties
      expect(product.body.name).toBe('Product');
      expect(product.body.price).toBe(100);
      expect(product.body.stock).toBe(10);
      expect(product.body.id).toBeDefined();
    });
  });

  describe('Stock Updates', () => {
    it('should update product stock correctly', async () => {
      const product = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product', price: 100, stock: 10 });

      const updated = await request(app.getHttpServer())
        .patch(`/products/${product.body.id}/stock`)
        .send({ stock: 20 })
        .expect(200);

      // State verification: stock updated
      expect(updated.body.stock).toBe(20);
    });
  });

  describe('Stock After Order Operations', () => {
    it('should not change stock when order is created', async () => {
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ email: `user${Date.now()}@test.com` });

      await request(app.getHttpServer())
        .patch(`/users/${user.body.id}/balance`)
        .send({ balance: 1000 });

      const product = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product', price: 100, stock: 10 });

      // State verification: initial stock
      expect(product.body.stock).toBe(10);

      await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: user.body.id,
          items: [{ productId: product.body.id, quantity: 3 }],
        });

      // State verification: stock unchanged after order creation
      const productAfterOrder = await request(app.getHttpServer())
        .get('/products')
        .expect(200);
      const updatedProduct = productAfterOrder.body.find(
        (p: any) => p.id === product.body.id,
      );
      expect(updatedProduct.stock).toBe(10);
    });

    it('should decrease stock when order is paid', async () => {
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

      // Pay order
      await request(app.getHttpServer())
        .patch(`/orders/${order.body.id}/status`)
        .send({ status: 'paid' })
        .expect(200);

      // State verification: stock decreased after payment
      const products = await request(app.getHttpServer())
        .get('/products')
        .expect(200);
      const updatedProduct = products.body.find(
        (p: any) => p.id === product.body.id,
      );
      expect(updatedProduct.stock).toBe(7); // 10 - 3
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
        .send({ name: 'Product', price: 100, stock: 10 });

      // Create and pay first order
      const order1 = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: user.body.id,
          items: [{ productId: product.body.id, quantity: 2 }],
        });

      await request(app.getHttpServer())
        .patch(`/orders/${order1.body.id}/status`)
        .send({ status: 'paid' });

      // Create and pay second order
      const order2 = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: user.body.id,
          items: [{ productId: product.body.id, quantity: 3 }],
        });

      await request(app.getHttpServer())
        .patch(`/orders/${order2.body.id}/status`)
        .send({ status: 'paid' });

      // State verification: stock decreased twice
      const products = await request(app.getHttpServer())
        .get('/products')
        .expect(200);
      const updatedProduct = products.body.find(
        (p: any) => p.id === product.body.id,
      );
      expect(updatedProduct.stock).toBe(5); // 10 - 2 - 3
    });

    it('should handle orders with multiple products correctly', async () => {
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ email: `user${Date.now()}@test.com` });

      await request(app.getHttpServer())
        .patch(`/users/${user.body.id}/balance`)
        .send({ balance: 1000 });

      const product1 = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product1', price: 100, stock: 10 });

      const product2 = await request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Product2', price: 200, stock: 15 });

      const order = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId: user.body.id,
          items: [
            { productId: product1.body.id, quantity: 2 },
            { productId: product2.body.id, quantity: 3 },
          ],
        });

      // Pay order
      await request(app.getHttpServer())
        .patch(`/orders/${order.body.id}/status`)
        .send({ status: 'paid' })
        .expect(200);

      // State verification: both products' stock decreased
      const products = await request(app.getHttpServer())
        .get('/products')
        .expect(200);
      const updatedProduct1 = products.body.find(
        (p: any) => p.id === product1.body.id,
      );
      const updatedProduct2 = products.body.find(
        (p: any) => p.id === product2.body.id,
      );
      expect(updatedProduct1.stock).toBe(8); // 10 - 2
      expect(updatedProduct2.stock).toBe(12); // 15 - 3
    });
  });
});


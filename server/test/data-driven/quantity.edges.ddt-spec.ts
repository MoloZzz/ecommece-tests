import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import * as request from 'supertest';

describe('Quantity edges (data-driven)', () => {
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

  const quantityCases = [
    { quantity: 1, expected: 201 },
    { quantity: 5, expected: 201 },
    { quantity: 6, expected: 400 },
    { quantity: 0, expected: 400 },
  ];

  it.each(quantityCases)(
    'Quantity $quantity → $expected',
    async ({ quantity, expected }) => {
      // Create a fresh product for each test to avoid stock depletion
      const product = await request(app.getHttpServer())
        .post('/products')
        .send({
          name: `Laptop-${Date.now()}-${Math.random()}`,
          price: 500,
          stock: 5,
        });

      const productId = product.body.id;

      // Create a fresh user for each test
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({ email: `test${Date.now()}${Math.random()}@mail.com` });

      const userId = user.body.id;

      const res = await request(app.getHttpServer())
        .post('/orders')
        .send({
          userId,
          items: [{ productId, quantity }],
        });

      expect(res.status).toBe(expected);
    }
  );
});

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import * as request from 'supertest';

describe('Email validation (data-driven)', () => {
  let app: INestApplication;

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

  const emailCases = [
    { email: `valid${Date.now()}@mail.com`, expected: 201 },
    { email: `invalid${Date.now()}`, expected: 400 },
    { email: '', expected: 400 },
    { email: null, expected: 400 },
  ];

  it.each(emailCases)(
    'Email: $email',
    async ({ email, expected }) => {
      const res = await request(app.getHttpServer())
        .post('/users')
        .send({ email });

      expect(res.status).toBe(expected);
    }
  );
});

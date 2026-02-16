import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = 'http://localhost:3000';
const USER_ID = 'f9f2681a-8c76-494d-87e3-95bdca79d579';
const PRODUCT_ID = 'c4eb5c6b-89c8-4941-83fb-b35cd30aa530';

export const options = {
  scenarios: {
    mixed: {
      executor: 'constant-vus',
      vus: 50,
      duration: '2m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],     // <5% errors
    http_req_duration: ['p(95)<800'],   // 95% requests <800ms
  },
};

export default function () {
  const rand = Math.floor(Math.random() * 100) + 1;

  if (rand <= 70) {
    const res = http.get(`${BASE_URL}/products`);

    check(res, {
      'GET status 200': (r) => r.status === 200,
      'GET body exists': (r) => r.body !== null,
    });

  } else {
    const res = http.post(
      `${BASE_URL}/orders`,
      JSON.stringify({
        userId: USER_ID,
        items: [{ productId: PRODUCT_ID, quantity: 1 }],
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    const ok = check(res, {
      'POST status 201': (r) => r.status === 201,
      'POST body exists': (r) => r.body !== null,
    });

    if (ok) {
      let body;
      try {
        body = JSON.parse(res.body);
      } catch (e) {
        console.error('Invalid JSON response');
        return;
      }

      check(body, {
        'order has id': (b) => b.id !== undefined,
      });
    }
  }
}
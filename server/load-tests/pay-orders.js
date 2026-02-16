import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = 'http://localhost:3000';
const USER_ID = 'f9f2681a-8c76-494d-87e3-95bdca79d579';
const PRODUCT_ID = 'c4eb5c6b-89c8-4941-83fb-b35cd30aa530';

export const options = {
  vus: 80,
  duration: '1m',
};

export default function () {
  const createRes = http.post(`${BASE_URL}/orders`, JSON.stringify({
    userId: USER_ID,
    items: [
      { productId: PRODUCT_ID, quantity: 1 },
    ],
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (createRes.status !== 201) return;

  const orderId = JSON.parse(createRes.body).id;

  const payRes = http.patch(`${BASE_URL}/orders/${orderId}/status`,
    JSON.stringify({ status: 'paid' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(payRes, {
    'paid or rejected correctly': (r) =>
      r.status === 200 || r.status === 400,
  });
}

import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = 'http://localhost:3000';
const USER_ID = 'f9f2681a-8c76-494d-87e3-95bdca79d579';
const PRODUCT_ID = 'c4eb5c6b-89c8-4941-83fb-b35cd30aa530';

export const options = {
  vus: 30,
  duration: '1m',
};

export default function () {
  const payload = JSON.stringify({
    userId: USER_ID,
    items: [
      {
        productId: PRODUCT_ID,
        quantity: 1,
      },
    ],
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(`${BASE_URL}/orders`, payload, params);

  check(res, {
    'order created': (r) => r.status === 201,
  });
}

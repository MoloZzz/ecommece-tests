import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 50,          // 50 virtual users
  duration: '1m',   // 1 min
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% < 500ms
    http_req_failed: ['rate<0.01'],    // <1% errors
  },
};

export default function () {
  const res = http.get('http://localhost:3000/products');

  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}

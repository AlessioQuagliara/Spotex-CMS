import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://localhost:8000'; // lascia localhost o cambia con il tuo URL

export const options = {
  vus: 1000,      // 1000 utenti virtuali per raggiungere alto RPS
  duration: '30s' // durata del test
};

export default function () {
  const res = http.get(`${BASE_URL}/`, {
    headers: {
      Accept: 'application/json',
    },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response is JSON': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
    'has message field': (r) => r.json('message') !== undefined,
    'message is string': (r) => typeof r.json('message') === 'string',
  });

  // sleep(1); // Rimosso per permettere rate più alto
}


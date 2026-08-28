import test from 'node:test';
import assert from 'node:assert/strict';
import { requestRates } from './rate-client.js';

test('requestRates retries one transient failure and adds the base identity rate', async () => {
  let calls = 0;
  const fakeFetch = async () => {
    calls += 1;
    if (calls === 1) return { ok: false, status: 503 };
    return {
      ok: true,
      async json() { return [{ date: '2026-08-28', quote: 'IQD', rate: 1311.15 }]; },
    };
  };
  const result = await requestRates('USD', { fetchImpl: fakeFetch, attempts: 2, pauseMs: 0, timeoutMs: 100 });
  assert.equal(calls, 2);
  assert.equal(result.rates.USD, 1);
  assert.equal(result.rates.IQD, 1311.15);
  assert.equal(result.date, '2026-08-28');
});

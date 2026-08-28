import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('GeoChart rows use ISO country codes instead of geocoded names', async () => {
  const app = await readFile(new URL('./app.js', import.meta.url), 'utf8');
  assert.match(app, /rows\.push\(\[item\.code,/);
  assert.match(app, /rows\.push\(\[next\.code,/);
});

test('GeoChart also fills map-only territories from their local currency rate', async () => {
  const app = await readFile(new URL('./app.js', import.meta.url), 'utf8');
  assert.match(app, /MAP_TERRITORIES/);
  assert.match(app, /territory\.currency/);
  assert.match(app, /rows\.push\(\[territory\.code, 1\]\)/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('analytics loader supports a configured Cloudflare Web Analytics token', async () => {
  const js = await readFile(new URL('./analytics.js', import.meta.url), 'utf8');
  assert.match(js, /const CLOUDFLARE_WEB_ANALYTICS_TOKEN = '[0-9a-f]*';/);
  assert.match(js, /if \(!CLOUDFLARE_WEB_ANALYTICS_TOKEN\) return;/);
  assert.match(js, /static\.cloudflareinsights\.com\/beacon\.min\.js/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pages = [
  'index.html',
  'millionaire/index.html',
  'custom-boob/index.html',
];

for (const page of pages) {
  test(`${page} uses the shared Ko-fi support control`, async () => {
    const html = await readFile(new URL(`./${page}`, import.meta.url), 'utf8');
    assert.match(html, /href="https:\/\/ko-fi\.com\/sphere_homotopy"/);
    assert.match(html, /class="support-project"/);
    assert.match(html, /rel="noopener noreferrer"/);
  });
}

test('shared support control displays the Ko-fi label and cup mark without an arrow', async () => {
  const css = await readFile(new URL('./support.css', import.meta.url), 'utf8');
  assert.match(css, /font-size:0/);
  assert.match(css, /data:image\/svg\+xml/);
  assert.match(css, /content:"Support me on Ko-fi"/);
  assert.doesNotMatch(css, /content:[^;}]*↗/);
});

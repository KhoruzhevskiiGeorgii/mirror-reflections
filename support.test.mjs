import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pages = [
  ['index.html', './go/kofi/mirrors/', './analytics.js'],
  ['millionaire/index.html', '../go/kofi/millionaire/', '../analytics.js'],
  ['custom-boob/index.html', '../go/kofi/custom-boob/', '../analytics.js'],
];

for (const [page, supportHref, analyticsSrc] of pages) {
  test(`${page} uses the shared tracked Ko-fi support control`, async () => {
    const html = await readFile(new URL(`./${page}`, import.meta.url), 'utf8');
    assert.match(html, new RegExp(`href="${supportHref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
    assert.match(html, new RegExp(`src="${analyticsSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
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

test('Ko-fi mark sits close to the label', async () => {
  const css = await readFile(new URL('./support.css', import.meta.url), 'utf8');
  assert.match(css, /gap:4px/);
});

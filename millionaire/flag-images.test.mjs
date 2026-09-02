import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');
const js = await readFile(new URL('./flag-images.js', import.meta.url), 'utf8');
const css = await readFile(new URL('./flag-images.css', import.meta.url), 'utf8');

test('millionaire page loads OS-independent flag rendering', () => {
  assert.match(html, /flag-images\.css/);
  assert.match(html, /flag-images\.js/);
  assert.match(js, /flagcdn\.com/);
});

test('flag images have dedicated sizing for hero, milestone, chips and currency selector', () => {
  assert.match(css, /\.flag > img/);
  assert.match(css, /#next-flag > img/);
  assert.match(css, /\.country-chip > img/);
  assert.match(css, /\.currency-flag > img/);
});

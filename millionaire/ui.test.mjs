import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');

test('calculation stays on one page with inline status instead of fullscreen loading/error screens', () => {
  assert.doesNotMatch(html, /id="loading"/);
  assert.doesNotMatch(html, /id="error"/);
  assert.match(html, /id="form-status"/);
});

test('result contains best match, next milestone and world map', () => {
  assert.match(html, /id="best-match"/);
  assert.match(html, /id="next-milestone"/);
  assert.match(html, /id="world-map"/);
});

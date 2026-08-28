import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pages = [
  'index.html',
  'millionaire/index.html',
  'custom-boob/index.html',
];

for (const page of pages) {
  test(`${page} has the unified Ko-fi support CTA`, async () => {
    const html = await readFile(new URL(`./${page}`, import.meta.url), 'utf8');
    assert.match(html, /href="https:\/\/ko-fi\.com\/sphere_homotopy"/);
    assert.match(html, /class="support-project"/);
    assert.match(html, /class="kofi-mark" aria-hidden="true"/);
    assert.match(html, />Support me on Ko-fi<\/span>/);
    assert.doesNotMatch(html, /Support this project/);
    assert.doesNotMatch(html, /Support me on Ko-fi[^<]*↗/);
    assert.match(html, /rel="noopener noreferrer"/);
  });
}

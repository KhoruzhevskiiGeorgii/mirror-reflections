import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const routes = [
  ['go/millionaire/reddit/index.html', '/x_memes/millionaire/'],
  ['go/millionaire/hacker-news/index.html', '/x_memes/millionaire/'],
  ['go/millionaire/product-hunt/index.html', '/x_memes/millionaire/'],
  ['go/kofi/millionaire/index.html', 'https://ko-fi.com/sphere_homotopy'],
  ['go/kofi/mirrors/index.html', 'https://ko-fi.com/sphere_homotopy'],
  ['go/kofi/custom-boob/index.html', 'https://ko-fi.com/sphere_homotopy'],
];

for (const [path, target] of routes) {
  test(`${path} is a noindex tracked redirect to ${target}`, async () => {
    const html = await readFile(new URL(`./${path}`, import.meta.url), 'utf8');
    assert.match(html, /name="robots" content="noindex,nofollow"/);
    assert.match(html, new RegExp(`data-target="${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
    assert.match(html, /src="\.\.\/\.\.\/\.\.\/analytics\.js"/);
    assert.match(html, /setTimeout\(.*location\.replace/);
  });
}

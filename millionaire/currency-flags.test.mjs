import test from 'node:test';
import assert from 'node:assert/strict';
import { currencyMarker, currencyLabel } from './currency-flags.js';

test('well-known currencies use recognizable issuer markers', () => {
  assert.equal(currencyMarker('USD'), '🇺🇸');
  assert.equal(currencyMarker('EUR'), '🇪🇺');
  assert.equal(currencyMarker('JPY'), '🇯🇵');
  assert.equal(currencyMarker('RSD'), '🇷🇸');
});

test('multi-country regional currencies use a neutral globe', () => {
  assert.equal(currencyMarker('XOF'), '🌍');
  assert.equal(currencyMarker('XAF'), '🌍');
  assert.equal(currencyLabel('XCD'), '🌍 XCD');
});

test('currency labels put the marker immediately before the code', () => {
  assert.equal(currencyLabel('USD'), '🇺🇸 USD');
  assert.equal(currencyLabel('EUR'), '🇪🇺 EUR');
});

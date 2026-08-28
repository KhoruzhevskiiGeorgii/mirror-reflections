import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAmount, rankMillionaireCountries, findNextMilestone, buildShareText } from './core.js';

test('validateAmount accepts positive finite amounts and rejects invalid values', () => {
  assert.equal(validateAmount('12500'), 12500);
  assert.equal(validateAmount('12,500'), 12500);
  for (const value of ['', '0', '-1', 'nope', '1e20']) assert.throws(() => validateAmount(value));
});

test('rankMillionaireCountries returns qualifying countries closest to threshold first', () => {
  const countries = [
    { country: 'Vietnam', currency: 'VND', flag: '🇻🇳' },
    { country: 'Indonesia', currency: 'IDR', flag: '🇮🇩' },
    { country: 'Japan', currency: 'JPY', flag: '🇯🇵' },
  ];
  const rates = { VND: 26000, IDR: 16000, JPY: 150 };
  const ranked = rankMillionaireCountries(100, rates, countries);
  assert.deepEqual(ranked.map(x => x.country), ['Indonesia', 'Vietnam']);
});

test('findNextMilestone picks the locked country needing the smallest extra base amount', () => {
  const countries = [
    { country: 'A', currency: 'AAA', flag: 'A' },
    { country: 'B', currency: 'BBB', flag: 'B' },
    { country: 'C', currency: 'CCC', flag: 'C' },
  ];
  const milestone = findNextMilestone(100, { AAA: 12000, BBB: 9000, CCC: 5000 }, countries);
  assert.equal(milestone.country, 'B');
  assert.ok(Math.abs(milestone.extraBaseAmount - (1_000_000 / 9000 - 100)) < 1e-9);
});

test('shared currencies produce one result per country', () => {
  const countries = [
    { country: 'A', currency: 'X', flag: 'A' },
    { country: 'B', currency: 'X', flag: 'B' },
  ];
  assert.equal(rankMillionaireCountries(2, { X: 600000 }, countries).length, 2);
});

test('buildShareText names the hero country and local amount', () => {
  const text = buildShareText({ country: 'Vietnam', flag: '🇻🇳', currency: 'VND', localAmount: 1234567 }, 50, 'USD');
  assert.match(text, /millionaire in Vietnam/i);
  assert.match(text, /1,234,567 VND/);
});

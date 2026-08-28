import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL_COUNTRIES } from './countries.js';

const byName = new Map(ALL_COUNTRIES.map((item) => [item.country, item]));

function expectCountry(name, code, currency) {
  const item = byName.get(name);
  assert.ok(item, `${name} should be tracked`);
  assert.equal(item.code, code);
  assert.equal(item.currency, currency);
}

test('country coverage is close to the full sovereign-state set', () => {
  assert.ok(ALL_COUNTRIES.length >= 197, `expected at least 197 countries, got ${ALL_COUNTRIES.length}`);
});

test('Russia, North Korea, and previously missing African countries are tracked', () => {
  expectCountry('Russia', 'RU', 'RUB');
  expectCountry('North Korea', 'KP', 'KPW');
  expectCountry('Democratic Republic of the Congo', 'CD', 'CDF');
  expectCountry('Cameroon', 'CM', 'XAF');
  expectCountry('Côte d’Ivoire', 'CI', 'XOF');
  expectCountry('Senegal', 'SN', 'XOF');
  expectCountry('Sudan', 'SD', 'SDG');
  expectCountry('South Sudan', 'SS', 'SSP');
  expectCountry('Zimbabwe', 'ZW', 'ZWG');
});

test('Bulgaria uses euro after its 2026 changeover', () => {
  expectCountry('Bulgaria', 'BG', 'EUR');
});

test('country records have unique ISO region codes and generated flags', () => {
  const codes = ALL_COUNTRIES.map((item) => item.code);
  assert.equal(new Set(codes).size, codes.length);
  for (const item of ALL_COUNTRIES) {
    assert.match(item.code, /^[A-Z]{2}$/);
    assert.ok(item.flag, `${item.country} should have a flag`);
  }
});

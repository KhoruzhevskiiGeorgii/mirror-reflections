const MAX_AMOUNT = 1e15;
const DEFAULT_THRESHOLD = 1_000_000;

export function validateAmount(value) {
  if (value === null || value === undefined || String(value).trim() === '') throw new Error('Enter an amount');
  const amount = Number(String(value).replace(/,/g, ''));
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) throw new Error('Enter a positive amount below 1 quadrillion');
  return amount;
}

function enrichCountry(amount, rates, item, threshold) {
  const rate = Number(rates[item.currency]);
  if (!Number.isFinite(rate) || rate <= 0) return null;
  const localAmount = amount * rate;
  return {
    ...item,
    rate,
    localAmount,
    targetBaseAmount: threshold / rate,
  };
}

export function rankMillionaireCountries(amount, rates, countries, threshold = DEFAULT_THRESHOLD) {
  return countries
    .map((item) => enrichCountry(amount, rates, item, threshold))
    .filter((item) => item && item.localAmount >= threshold)
    .sort((a, b) => a.localAmount - b.localAmount || a.country.localeCompare(b.country));
}

export function findNextMilestone(amount, rates, countries, threshold = DEFAULT_THRESHOLD) {
  const candidates = countries
    .map((item) => enrichCountry(amount, rates, item, threshold))
    .filter((item) => item && item.localAmount < threshold)
    .map((item) => ({ ...item, extraBaseAmount: item.targetBaseAmount - amount }))
    .filter((item) => Number.isFinite(item.extraBaseAmount) && item.extraBaseAmount > 0)
    .sort((a, b) => a.extraBaseAmount - b.extraBaseAmount || a.country.localeCompare(b.country));
  return candidates[0] || null;
}

export function formatMoney(value, currency) {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: value >= 1000 ? 0 : 2 }).format(value)} ${currency}`;
}

export function buildShareText(hero, amount, baseCurrency) {
  return `${hero.flag} I’m a millionaire in ${hero.country}. ${formatMoney(amount, baseCurrency)} = ${formatMoney(hero.localAmount, hero.currency)}.`;
}

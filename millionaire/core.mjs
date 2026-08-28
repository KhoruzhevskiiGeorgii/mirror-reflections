const MAX_AMOUNT = 1e15;

export function validateAmount(value) {
  if (value === null || value === undefined || String(value).trim() === '') throw new Error('Enter an amount');
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) throw new Error('Enter a positive amount below 1 quadrillion');
  return amount;
}

export function rankMillionaireCountries(amount, rates, countries, threshold = 1_000_000) {
  return countries
    .map((item) => ({ ...item, localAmount: amount * (rates[item.currency] ?? 0) }))
    .filter((item) => Number.isFinite(item.localAmount) && item.localAmount >= threshold)
    .sort((a, b) => a.localAmount - b.localAmount || a.country.localeCompare(b.country));
}

export function formatMoney(value, currency) {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: value >= 1000 ? 0 : 2 }).format(value)} ${currency}`;
}

export function buildShareText(hero, amount, baseCurrency) {
  return `${hero.flag} I’m a millionaire in ${hero.country}. ${formatMoney(amount, baseCurrency)} = ${formatMoney(hero.localAmount, hero.currency)}.`;
}

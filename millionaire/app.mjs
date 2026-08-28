import { ALL_COUNTRIES } from './countries.mjs';
import { validateAmount, rankMillionaireCountries, formatMoney, buildShareText } from './core.mjs';

const form = document.querySelector('#money-form');
const amountInput = document.querySelector('#amount');
const currencySelect = document.querySelector('#currency');
const landing = document.querySelector('#landing');
const loading = document.querySelector('#loading');
const errorBox = document.querySelector('#error');
const result = document.querySelector('#result');
const heroFlag = document.querySelector('#hero-flag');
const heroCountry = document.querySelector('#hero-country');
const heroMoney = document.querySelector('#hero-money');
const heroOriginal = document.querySelector('#hero-original');
const count = document.querySelector('#country-count');
const others = document.querySelector('#others');
const rateDate = document.querySelector('#rate-date');
const shareX = document.querySelector('#share-x');
const copy = document.querySelector('#copy');
const again = document.querySelector('#again');
let currentShare = '';

const currencies = [...new Set(ALL_COUNTRIES.map(x => x.currency))].sort();
for (const code of currencies) {
  const option = document.createElement('option'); option.value = code; option.textContent = code; currencySelect.append(option);
}
currencySelect.value = 'USD';

function setView(name) {
  for (const el of [landing, loading, errorBox, result]) el.hidden = true;
  document.querySelector(`#${name}`).hidden = false;
}

async function fetchRates(base) {
  const response = await fetch(`https://api.frankfurter.dev/v2/rates?base=${encodeURIComponent(base)}`);
  if (!response.ok) throw new Error('Exchange-rate service is unavailable right now.');
  const rows = await response.json();
  const rates = Object.fromEntries(rows.map(row => [row.quote, row.rate]));
  rates[base] = 1;
  return { rates, date: rows.map(r => r.date).filter(Boolean).sort().at(-1) || 'latest available' };
}

async function calculate(amountValue, currency) {
  try {
    const amount = validateAmount(amountValue);
    setView('loading');
    const { rates, date } = await fetchRates(currency);
    const ranked = rankMillionaireCountries(amount, rates, ALL_COUNTRIES);
    if (!ranked.length) throw new Error('Not a millionaire anywhere yet. Try a bigger number.');
    const hero = ranked[0];
    heroFlag.textContent = hero.flag;
    heroCountry.textContent = hero.country;
    heroMoney.textContent = formatMoney(hero.localAmount, hero.currency);
    heroOriginal.textContent = `${formatMoney(amount, currency)} makes you a millionaire here.`;
    count.textContent = ranked.length === 1 ? '1 country unlocked' : `${ranked.length} countries unlocked`;
    rateDate.textContent = `FX data: ${date} · Frankfurter`;
    others.replaceChildren(...ranked.slice(1).map(item => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="other-country"><b>${item.flag}</b> ${item.country}</span><strong>${formatMoney(item.localAmount, item.currency)}</strong>`;
      return li;
    }));
    currentShare = buildShareText(hero, amount, currency);
    const url = new URL(location.href); url.search = ''; url.searchParams.set('amount', amount); url.searchParams.set('currency', currency);
    history.replaceState(null, '', url);
    setView('result');
  } catch (error) {
    document.querySelector('#error-message').textContent = error.message || 'Something went wrong.';
    setView('error');
  }
}

form.addEventListener('submit', e => { e.preventDefault(); calculate(amountInput.value, currencySelect.value); });
document.querySelector('#retry').addEventListener('click', () => calculate(amountInput.value, currencySelect.value));
again.addEventListener('click', () => { history.replaceState(null, '', location.pathname); setView('landing'); amountInput.focus(); });
shareX.addEventListener('click', () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(currentShare)}&url=${encodeURIComponent(location.href)}`, '_blank', 'noopener,noreferrer'));
copy.addEventListener('click', async () => { await navigator.clipboard.writeText(`${currentShare} ${location.href}`); const old = copy.textContent; copy.textContent = 'Copied!'; setTimeout(() => copy.textContent = old, 1400); });

const params = new URLSearchParams(location.search);
if (params.has('amount')) {
  amountInput.value = params.get('amount');
  const requested = params.get('currency'); if (currencies.includes(requested)) currencySelect.value = requested;
  calculate(amountInput.value, currencySelect.value);
}

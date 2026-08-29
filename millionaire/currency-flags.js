import { ALL_COUNTRIES } from './countries.js';

const ISSUER_MARKERS = new Map([
  ['AUD', '🇦🇺'],
  ['CAD', '🇨🇦'],
  ['CHF', '🇨🇭'],
  ['DKK', '🇩🇰'],
  ['EUR', '🇪🇺'],
  ['GBP', '🇬🇧'],
  ['JPY', '🇯🇵'],
  ['NOK', '🇳🇴'],
  ['NZD', '🇳🇿'],
  ['SEK', '🇸🇪'],
  ['USD', '🇺🇸'],
  ['XAF', '🌍'],
  ['XCD', '🌍'],
  ['XOF', '🌍'],
  ['XPF', '🌍'],
]);

export function currencyMarker(currency) {
  if (ISSUER_MARKERS.has(currency)) return ISSUER_MARKERS.get(currency);
  const carriers = ALL_COUNTRIES.filter((item) => item.currency === currency);
  if (carriers.length === 1) return carriers[0].flag;
  return '🌍';
}

export function currencyLabel(currency) {
  return `${currencyMarker(currency)} ${currency}`;
}

if (typeof document !== 'undefined') {
  const select = document.querySelector('#currency');
  const flag = document.querySelector('#currency-flag');

  if (select && flag) {
    const syncFlag = () => {
      flag.textContent = currencyMarker(select.value || 'USD');
    };

    syncFlag();
    select.addEventListener('change', syncFlag);
    new MutationObserver(syncFlag).observe(select, { childList: true });
  }
}

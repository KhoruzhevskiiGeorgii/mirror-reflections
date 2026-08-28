import { ALL_COUNTRIES } from './countries.js';
import { validateAmount, rankMillionaireCountries, findNextMilestone, formatMoney, buildShareText } from './core.js';
import { requestRates } from './rate-client.js';

const $ = (selector) => document.querySelector(selector);
const form = $('#money-form');
const amountInput = $('#amount');
const currencySelect = $('#currency');
const submitButton = $('#submit-button');
const submitLabel = $('#submit-label');
const formStatus = $('#form-status');
const result = $('#result');
const worldMap = $('#world-map');
const mapFallback = $('#map-fallback');
let currentShare = '';
let googleChartsPromise = null;

const CACHE_PREFIX = 'millionaire-fx-v3:';
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;
const STALE_MAX_AGE = 14 * 24 * 60 * 60 * 1000;
const inFlightRates = new Map();

const currencies = [...new Set(ALL_COUNTRIES.map((item) => item.currency))].sort();
for (const code of currencies) {
  const option = document.createElement('option');
  option.value = code;
  option.textContent = code;
  currencySelect.append(option);
}
currencySelect.value = currencies.includes('USD') ? 'USD' : currencies[0];

function setStatus(message = '', type = '') {
  formStatus.textContent = message;
  formStatus.className = `form-status${type ? ` ${type}` : ''}`;
}

function setBusy(busy) {
  submitButton.disabled = busy;
  submitLabel.textContent = busy ? 'Checking rates…' : 'Show me the map';
}

function cacheKey(base) {
  return `${CACHE_PREFIX}${base}`;
}

function readCachedRates(base, maxAge = CACHE_MAX_AGE) {
  try {
    const raw = localStorage.getItem(cacheKey(base));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > maxAge || !parsed?.data?.rates) return null;
    return { ...parsed.data, cached: true };
  } catch {
    return null;
  }
}

function writeCachedRates(base, data) {
  try {
    localStorage.setItem(cacheKey(base), JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // Storage may be unavailable in private/in-app browsers; network data still works.
  }
}

async function getRates(base) {
  const fresh = readCachedRates(base);
  if (fresh) return fresh;
  if (inFlightRates.has(base)) return inFlightRates.get(base);

  const task = requestRates(base, { attempts: 2, pauseMs: 300, timeoutMs: 7000 })
    .then((data) => {
      writeCachedRates(base, data);
      return { ...data, cached: false };
    })
    .catch((error) => {
      const stale = readCachedRates(base, STALE_MAX_AGE);
      if (stale) return { ...stale, stale: true };
      throw error;
    })
    .finally(() => inFlightRates.delete(base));

  inFlightRates.set(base, task);
  return task;
}

function warmRates(base) {
  getRates(base).catch(() => {});
}

function geoName(country) {
  return ({
    'Czechia': 'Czech Republic',
    'Türkiye': 'Turkey',
    'South Korea': 'South Korea',
    'North Macedonia': 'North Macedonia',
  })[country] || country;
}

function loadGoogleCharts() {
  if (window.google?.visualization?.GeoChart) return Promise.resolve();
  if (googleChartsPromise) return googleChartsPromise;

  googleChartsPromise = new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      fn(value);
    };
    const boot = () => {
      try {
        window.google.charts.load('current', { packages: ['geochart'] });
        window.google.charts.setOnLoadCallback(() => finish(resolve));
      } catch (error) {
        finish(reject, error);
      }
    };

    if (window.google?.charts) {
      boot();
    } else {
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/charts/loader.js';
      script.async = true;
      script.dataset.googleCharts = 'true';
      script.onload = boot;
      script.onerror = () => finish(reject, new Error('Map library unavailable'));
      document.head.append(script);
    }
    setTimeout(() => finish(reject, new Error('Map timed out')), 6500);
  });

  return googleChartsPromise;
}

async function renderMap(unlocked, best, next) {
  const unlockedNames = new Set(unlocked.map((item) => item.country));
  mapFallback.hidden = true;
  worldMap.innerHTML = '<div class="map-placeholder">Loading map…</div>';

  try {
    await loadGoogleCharts();
    const rows = [['Country', 'Status']];
    for (const item of unlocked) rows.push([geoName(item.country), item.country === best.country ? 3 : 1]);
    if (next) rows.push([geoName(next.country), 2]);

    const data = window.google.visualization.arrayToDataTable(rows);
    const chart = new window.google.visualization.GeoChart(worldMap);
    chart.draw(data, {
      backgroundColor: 'transparent',
      datalessRegionColor: '#151d22',
      defaultColor: '#31503a',
      colorAxis: { minValue: 1, maxValue: 3, colors: ['#31503a', '#9c8cff', '#cfff28'] },
      legend: 'none',
      keepAspectRatio: true,
      tooltip: { textStyle: { color: '#111' } },
    });
  } catch {
    worldMap.innerHTML = '<div class="map-placeholder">Map unavailable on this connection.</div>';
    const visible = unlocked.slice(0, 18).map((item) => `${item.flag} ${item.country}`).join(' · ');
    mapFallback.textContent = `${unlockedNames.size} unlocked: ${visible}${unlocked.length > 18 ? ' · …' : ''}`;
    mapFallback.hidden = false;
  }
}

function renderResult(amount, currency, rateInfo) {
  const unlocked = rankMillionaireCountries(amount, rateInfo.rates, ALL_COUNTRIES);
  const next = findNextMilestone(amount, rateInfo.rates, ALL_COUNTRIES);
  if (!unlocked.length) throw new Error('Not a millionaire anywhere yet. Try a bigger number.');

  const best = unlocked[0];
  $('#hero-flag').textContent = best.flag;
  $('#hero-country').textContent = best.country;
  $('#hero-money').textContent = formatMoney(best.localAmount, best.currency);
  $('#hero-original').textContent = `${formatMoney(amount, currency)} puts you just over the million mark here.`;
  $('#country-count').textContent = unlocked.length === 1 ? '1 country unlocked' : `${unlocked.length} countries unlocked`;

  if (next) {
    $('#next-flag').textContent = next.flag;
    $('#next-country').textContent = next.country;
    $('#next-copy').textContent = `Add ${formatMoney(next.extraBaseAmount, currency)} to reach 1,000,000 ${next.currency}.`;
    const progress = Math.max(2, Math.min(99.5, (amount / next.targetBaseAmount) * 100));
    $('#next-progress').style.width = `${progress}%`;
  } else {
    $('#next-flag').textContent = '🌍';
    $('#next-country').textContent = 'World complete';
    $('#next-copy').textContent = 'You’re already a millionaire in every country we track.';
    $('#next-progress').style.width = '100%';
  }

  const chips = unlocked.map((item) => {
    const chip = document.createElement('span');
    chip.className = `country-chip${item.country === best.country ? ' best-chip' : ''}`;
    chip.textContent = `${item.flag} ${item.country}`;
    chip.title = formatMoney(item.localAmount, item.currency);
    return chip;
  });
  $('#others').replaceChildren(...chips);

  currentShare = buildShareText(best, amount, currency);
  $('#rate-date').textContent = `Reference FX: ${rateInfo.date} · Frankfurter${rateInfo.stale ? ' · cached fallback' : rateInfo.cached ? ' · cached' : ''}`;

  const url = new URL(location.href);
  url.search = '';
  url.searchParams.set('amount', amount);
  url.searchParams.set('currency', currency);
  history.replaceState(null, '', url);

  result.hidden = false;
  requestAnimationFrame(() => result.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  renderMap(unlocked, best, next);
}

async function calculate(amountValue, currency) {
  setStatus('');
  let amount;
  try {
    amount = validateAmount(amountValue);
  } catch (error) {
    setStatus(error.message, 'error');
    return;
  }

  setBusy(true);
  setStatus('Checking reference rates…');
  try {
    const rateInfo = await getRates(currency);
    renderResult(amount, currency, rateInfo);
    setStatus(rateInfo.stale ? 'Live FX was unavailable — using your last saved rates.' : 'Ready.', 'ok');
  } catch {
    setStatus('Couldn’t reach the FX service. Tap again — the page will stay right here.', 'error');
  } finally {
    setBusy(false);
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  calculate(amountInput.value, currencySelect.value);
});

currencySelect.addEventListener('change', () => warmRates(currencySelect.value));

$('#share-x').addEventListener('click', () => {
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(currentShare)}&url=${encodeURIComponent(location.href)}`, '_blank', 'noopener,noreferrer');
});

$('#copy').addEventListener('click', async () => {
  const button = $('#copy');
  try {
    await navigator.clipboard.writeText(`${currentShare} ${location.href}`);
    const previous = button.textContent;
    button.textContent = 'Copied';
    setTimeout(() => { button.textContent = previous; }, 1400);
  } catch {
    setStatus('Copy was blocked by the browser. Use Share on X or copy the URL.', 'error');
  }
});

warmRates(currencySelect.value);

const params = new URLSearchParams(location.search);
if (params.has('amount')) {
  amountInput.value = params.get('amount');
  const requested = params.get('currency');
  if (requested && currencies.includes(requested)) currencySelect.value = requested;
  calculate(amountInput.value, currencySelect.value);
}

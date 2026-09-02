import { ALL_COUNTRIES } from './countries.js';

const FLAG_TO_CODE = new Map(ALL_COUNTRIES.map((item) => [item.flag, item.code.toLowerCase()]));
FLAG_TO_CODE.set('🇪🇺', 'eu');

function makeFlag(code, fallbackMarker) {
  const image = document.createElement('img');
  image.className = 'flag-image';
  image.src = `https://flagcdn.com/${code}.svg`;
  image.alt = '';
  image.setAttribute('aria-hidden', 'true');
  image.decoding = 'async';
  image.addEventListener('error', () => {
    image.replaceWith(document.createTextNode(fallbackMarker));
  }, { once: true });
  return image;
}

function replaceStandaloneFlag(element) {
  if (!element || element.querySelector('img.flag-image')) return;
  const marker = element.textContent.trim();
  const code = FLAG_TO_CODE.get(marker);
  if (!code) return;
  element.replaceChildren(makeFlag(code, marker));
}

function replaceChipFlag(chip) {
  if (chip.querySelector('img.flag-image')) return;
  const text = chip.textContent;
  const item = ALL_COUNTRIES.find((country) => text.startsWith(`${country.flag} `));
  if (!item) return;

  const label = text.slice(item.flag.length).trimStart();
  chip.replaceChildren(
    makeFlag(item.code.toLowerCase(), item.flag),
    document.createTextNode(label),
  );
}

function refreshFlags() {
  replaceStandaloneFlag(document.querySelector('#hero-flag'));
  replaceStandaloneFlag(document.querySelector('#next-flag'));
  replaceStandaloneFlag(document.querySelector('#currency-flag'));
  document.querySelectorAll('.country-chip').forEach(replaceChipFlag);
}

refreshFlags();
new MutationObserver(refreshFlags).observe(document.body, { childList: true, subtree: true });

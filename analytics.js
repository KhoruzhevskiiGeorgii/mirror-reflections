(() => {
  const CLOUDFLARE_WEB_ANALYTICS_TOKEN = '';
  if (!CLOUDFLARE_WEB_ANALYTICS_TOKEN) return;
  if (document.querySelector('script[data-cf-beacon]')) return;

  const script = document.createElement('script');
  script.defer = true;
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  script.dataset.cfBeacon = JSON.stringify({ token: CLOUDFLARE_WEB_ANALYTICS_TOKEN });
  document.head.append(script);
})();

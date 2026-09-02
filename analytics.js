(() => {
  const CLOUDFLARE_WEB_ANALYTICS_TOKEN = '74877530d8b04bac8b1771a4d1748e63';
  if (!CLOUDFLARE_WEB_ANALYTICS_TOKEN) return;
  if (document.querySelector('script[data-cf-beacon]')) return;

  const script = document.createElement('script');
  script.defer = true;
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  script.dataset.cfBeacon = JSON.stringify({ token: CLOUDFLARE_WEB_ANALYTICS_TOKEN });
  document.head.append(script);
})();

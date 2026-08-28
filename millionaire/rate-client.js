const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function requestRates(base, options = {}) {
  const {
    fetchImpl = fetch,
    attempts = 2,
    pauseMs = 350,
    timeoutMs = 8000,
  } = options;

  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const response = await fetchImpl(`https://api.frankfurter.dev/v2/rates?base=${encodeURIComponent(base)}`, controller ? { signal: controller.signal } : undefined);
      if (!response?.ok) throw new Error(`FX HTTP ${response?.status ?? 'error'}`);
      const rows = await response.json();
      if (!Array.isArray(rows) || rows.length === 0) throw new Error('FX returned no rates');
      const rates = Object.fromEntries(rows.map((row) => [row.quote, Number(row.rate)]).filter(([, rate]) => Number.isFinite(rate) && rate > 0));
      rates[base] = 1;
      const date = rows.map((row) => row.date).filter(Boolean).sort().slice(-1)[0] || 'latest available';
      return { rates, date };
    } catch (error) {
      lastError = error;
      if (attempt + 1 < attempts && pauseMs > 0) await sleep(pauseMs);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  throw lastError || new Error('FX request failed');
}

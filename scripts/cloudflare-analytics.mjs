import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql';
const API_BASE = 'https://api.cloudflare.com/client/v4';
const HOST = 'sphere-homotopy.github.io';
const PATHS = {
  total: '/x_memes/millionaire/',
  reddit: '/x_memes/go/millionaire/reddit/',
  hackerNews: '/x_memes/go/millionaire/hacker-news/',
  productHunt: '/x_memes/go/millionaire/product-hunt/',
  kofi: '/x_memes/go/kofi/millionaire/',
};
const TRACKED_PATHS = Object.values(PATHS);
const MAX_GROUPS_PER_DAY = 5000;
const QUERY_CONCURRENCY = 4;

function q(value) {
  return JSON.stringify(value);
}

export function splitWindowByUtcDay(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime())) {
    throw new Error('start and end must be valid ISO timestamps');
  }
  if (startDate >= endDate) throw new Error('start must be before end');

  const chunks = [];
  let cursor = startDate;
  while (cursor < endDate) {
    const nextMidnight = new Date(Date.UTC(
      cursor.getUTCFullYear(),
      cursor.getUTCMonth(),
      cursor.getUTCDate() + 1,
    ));
    const chunkEnd = nextMidnight < endDate ? nextMidnight : endDate;
    chunks.push({ start: cursor.toISOString(), end: chunkEnd.toISOString() });
    cursor = chunkEnd;
  }
  return chunks;
}

export function buildGraphQLRequest({ accountTag, start, end }) {
  if (!accountTag || !start || !end) throw new Error('accountTag, start and end are required');
  const pathFilters = TRACKED_PATHS.map((requestPath) => `{ requestPath: ${q(requestPath)} }`).join(',\n');

  return {
    query: `query MillionaireAnalyticsDaily {
      viewer {
        accounts(filter: { accountTag: ${q(accountTag)} }) {
          series: rumPageloadEventsAdaptiveGroups(
            limit: ${MAX_GROUPS_PER_DAY}
            filter: { AND: [
              { datetime_geq: ${q(start)}, datetime_lt: ${q(end)} },
              { requestHost: ${q(HOST)} },
              { bot: 0 },
              { OR: [${pathFilters}] }
            ] }
          ) {
            count
            avg { sampleInterval }
            sum { visits }
            dimensions {
              requestPath
              countryName
              deviceType
              refererHost
            }
          }
        }
      }
    }`,
    variables: { accountTag, start, end },
  };
}

export function validateGraphQLResponse(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Cloudflare returned a non-object response');
  if (Array.isArray(payload.errors) && payload.errors.length) {
    throw new Error(`Cloudflare GraphQL error: ${payload.errors.map((e) => e.message || String(e)).join('; ')}`);
  }
  if (!payload.data?.viewer?.accounts) throw new Error('Cloudflare GraphQL response is missing viewer.accounts');
  return payload;
}

function add(map, key, value) {
  map.set(key, (map.get(key) || 0) + value);
}

function ranked(map, keyName) {
  return [...map.entries()]
    .map(([key, pageviews]) => ({ [keyName]: key, pageviews }))
    .sort((a, b) => b.pageviews - a.pageviews || String(a[keyName]).localeCompare(String(b[keyName])));
}

export function buildSnapshot(responseOrResponses, { generatedAt, start, end }) {
  const responses = Array.isArray(responseOrResponses) ? responseOrResponses : [responseOrResponses];
  let pageviews = 0;
  let visits = 0;
  let maxSampleInterval = 1;
  const acquisition = {
    redditPageviews: 0,
    hackerNewsPageviews: 0,
    productHuntPageviews: 0,
    kofiClickIntents: 0,
  };
  const referrers = new Map();
  const countries = new Map();
  const devices = new Map();

  for (const response of responses) {
    validateGraphQLResponse(response);
    const accounts = response.data.viewer.accounts;
    if (accounts.length !== 1) throw new Error(`Expected exactly one Cloudflare account, got ${accounts.length}`);
    const series = accounts[0].series || [];
    if (series.length >= MAX_GROUPS_PER_DAY) {
      throw new Error(`Cloudflare returned ${series.length} groups; daily result may be truncated at the ${MAX_GROUPS_PER_DAY} group limit`);
    }

    for (const row of series) {
      const sampleInterval = Number(row.avg?.sampleInterval ?? 1);
      if (!Number.isFinite(sampleInterval) || sampleInterval <= 0) {
        throw new Error(`Invalid Cloudflare sampleInterval ${row.avg?.sampleInterval}`);
      }
      maxSampleInterval = Math.max(maxSampleInterval, sampleInterval);
      if (sampleInterval > 1.000001) {
        throw new Error(`Cloudflare used adaptive sampling (sampleInterval ${sampleInterval}); refusing to label the snapshot exact`);
      }

      const count = Number(row.count || 0);
      const requestPath = row.dimensions?.requestPath;
      if (requestPath === PATHS.total) {
        pageviews += count;
        visits += Number(row.sum?.visits || 0);
        add(referrers, row.dimensions?.refererHost || '(direct)', count);
        add(countries, row.dimensions?.countryName || 'unknown', count);
        add(devices, row.dimensions?.deviceType || 'unknown', count);
      } else if (requestPath === PATHS.reddit) {
        acquisition.redditPageviews += count;
      } else if (requestPath === PATHS.hackerNews) {
        acquisition.hackerNewsPageviews += count;
      } else if (requestPath === PATHS.productHunt) {
        acquisition.productHuntPageviews += count;
      } else if (requestPath === PATHS.kofi) {
        acquisition.kofiClickIntents += count;
      }
    }
  }

  return {
    schemaVersion: 2,
    project: 'millionaire',
    source: 'cloudflare-web-analytics',
    generatedAt,
    window: { start, end },
    sampling: {
      exact: true,
      maxSampleInterval,
      strategy: 'utc-day-chunks',
    },
    pageviews,
    visits,
    visitsDefinition: 'pageviews initiated by a direct link or a referrer on a different hostname; not unique visitors',
    acquisition,
    topReferrers: ranked(referrers, 'referrer'),
    countries: ranked(countries, 'country'),
    devices: ranked(devices, 'device'),
  };
}

export async function discoverAccountTag(token, fetchImpl = fetch) {
  const response = await fetchImpl(`${API_BASE}/accounts?per_page=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await response.json();
  if (!response.ok || payload.success === false) {
    throw new Error(`Cloudflare account discovery failed: ${payload.errors?.[0]?.message || response.status}`);
  }
  const accounts = payload.result || [];
  if (accounts.length !== 1) {
    throw new Error(`Expected exactly one accessible Cloudflare account; set CLOUDFLARE_ACCOUNT_ID explicitly (found ${accounts.length})`);
  }
  return accounts[0].id;
}

async function fetchChunk({ token, accountTag, start, end, fetchImpl }) {
  const body = buildGraphQLRequest({ accountTag, start, end });
  const response = await fetchImpl(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`Cloudflare GraphQL HTTP ${response.status}`);
  validateGraphQLResponse(payload);
  return payload;
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function fetchSnapshot({ token, accountTag, start, end, generatedAt = new Date().toISOString(), fetchImpl = fetch }) {
  if (!token) throw new Error('CLOUDFLARE_API_TOKEN is required');
  const resolvedAccountTag = accountTag || await discoverAccountTag(token, fetchImpl);
  const chunks = splitWindowByUtcDay(start, end);
  const responses = await mapWithConcurrency(chunks, QUERY_CONCURRENCY, (chunk) => fetchChunk({
    token,
    accountTag: resolvedAccountTag,
    start: chunk.start,
    end: chunk.end,
    fetchImpl,
  }));
  return buildSnapshot(responses, { generatedAt, start, end });
}

function parseArgs(argv) {
  const args = { days: 7, output: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--days') args.days = Number(argv[++i]);
    else if (argv[i] === '--output') args.output = argv[++i];
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  if (!Number.isFinite(args.days) || args.days <= 0 || args.days > 30) throw new Error('--days must be between 1 and 30');
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - args.days * 86400_000);
  const snapshot = await fetchSnapshot({
    token: process.env.CLOUDFLARE_API_TOKEN,
    accountTag: process.env.CLOUDFLARE_ACCOUNT_ID,
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    generatedAt: endDate.toISOString(),
  });
  const text = `${JSON.stringify(snapshot, null, 2)}\n`;
  if (args.output) await writeFile(args.output, text, 'utf8');
  else process.stdout.write(text);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

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

function q(value) {
  return JSON.stringify(value);
}

function filterLiteral({ start, end, requestPath }) {
  return `{ AND: [
    { datetime_geq: ${q(start)}, datetime_leq: ${q(end)} },
    { requestHost: ${q(HOST)} },
    { bot: 0 },
    { requestPath: ${q(requestPath)} }
  ] }`;
}

export function buildGraphQLRequest({ accountTag, start, end }) {
  if (!accountTag || !start || !end) throw new Error('accountTag, start and end are required');
  const baseFilter = {
    AND: [
      { datetime_geq: start, datetime_leq: end },
      { requestHost: HOST },
      { bot: 0 },
    ],
  };
  const totalFilter = filterLiteral({ start, end, requestPath: PATHS.total });
  const redditFilter = filterLiteral({ start, end, requestPath: PATHS.reddit });
  const hackerNewsFilter = filterLiteral({ start, end, requestPath: PATHS.hackerNews });
  const productHuntFilter = filterLiteral({ start, end, requestPath: PATHS.productHunt });
  const kofiFilter = filterLiteral({ start, end, requestPath: PATHS.kofi });

  return {
    query: `query MillionaireAnalytics {
      viewer {
        accounts(filter: { accountTag: ${q(accountTag)} }) {
          total: rumPageloadEventsAdaptiveGroups(limit: 1, filter: ${totalFilter}) { count sum { visits } }
          reddit: rumPageloadEventsAdaptiveGroups(limit: 1, filter: ${redditFilter}) { count sum { visits } }
          hackerNews: rumPageloadEventsAdaptiveGroups(limit: 1, filter: ${hackerNewsFilter}) { count sum { visits } }
          productHunt: rumPageloadEventsAdaptiveGroups(limit: 1, filter: ${productHuntFilter}) { count sum { visits } }
          kofi: rumPageloadEventsAdaptiveGroups(limit: 1, filter: ${kofiFilter}) { count sum { visits } }
          referrers: rumPageloadEventsAdaptiveGroups(limit: 20, orderBy: [count_DESC], filter: ${totalFilter}) {
            count dimensions { refererHost }
          }
          countries: rumPageloadEventsAdaptiveGroups(limit: 100, orderBy: [count_DESC], filter: ${totalFilter}) {
            count dimensions { countryName }
          }
          devices: rumPageloadEventsAdaptiveGroups(limit: 20, orderBy: [count_DESC], filter: ${totalFilter}) {
            count dimensions { deviceType }
          }
        }
      }
    }`,
    variables: { accountTag, baseFilter },
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

function firstCount(groups) {
  return Array.isArray(groups) && groups[0] ? Number(groups[0].count || 0) : 0;
}

export function buildSnapshot(response, { generatedAt, start, end }) {
  validateGraphQLResponse(response);
  const accounts = response.data.viewer.accounts;
  if (accounts.length !== 1) throw new Error(`Expected exactly one Cloudflare account, got ${accounts.length}`);
  const data = accounts[0];
  const total = Array.isArray(data.total) && data.total[0] ? data.total[0] : { count: 0, sum: { visits: 0 } };

  return {
    schemaVersion: 1,
    project: 'millionaire',
    source: 'cloudflare-web-analytics',
    generatedAt,
    window: { start, end },
    pageviews: Number(total.count || 0),
    visits: Number(total.sum?.visits || 0),
    acquisition: {
      redditPageviews: firstCount(data.reddit),
      hackerNewsPageviews: firstCount(data.hackerNews),
      productHuntPageviews: firstCount(data.productHunt),
      kofiClickIntents: firstCount(data.kofi),
    },
    topReferrers: (data.referrers || []).map((row) => ({
      referrer: row.dimensions?.refererHost || '(direct)',
      pageviews: Number(row.count || 0),
    })),
    countries: (data.countries || []).map((row) => ({
      country: row.dimensions?.countryName || 'unknown',
      pageviews: Number(row.count || 0),
    })),
    devices: (data.devices || []).map((row) => ({
      device: row.dimensions?.deviceType || 'unknown',
      pageviews: Number(row.count || 0),
    })),
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

export async function fetchSnapshot({ token, accountTag, start, end, generatedAt = new Date().toISOString(), fetchImpl = fetch }) {
  if (!token) throw new Error('CLOUDFLARE_API_TOKEN is required');
  const resolvedAccountTag = accountTag || await discoverAccountTag(token, fetchImpl);
  const body = buildGraphQLRequest({ accountTag: resolvedAccountTag, start, end });
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
  return buildSnapshot(payload, { generatedAt, start, end });
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

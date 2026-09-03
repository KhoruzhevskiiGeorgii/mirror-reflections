import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGraphQLRequest,
  buildSnapshot,
  splitWindowByUtcDay,
  validateGraphQLResponse,
} from './cloudflare-analytics.mjs';

test('buildGraphQLRequest requests one exact low-cardinality series for all tracked Millionaire paths', () => {
  const request = buildGraphQLRequest({
    accountTag: 'acct',
    start: '2026-09-02T00:00:00.000Z',
    end: '2026-09-03T00:00:00.000Z',
  });

  assert.equal(request.variables.accountTag, 'acct');
  assert.match(request.query, /rumPageloadEventsAdaptiveGroups/);
  assert.match(request.query, /avg\s*\{\s*sampleInterval\s*\}/);
  assert.match(request.query, /dimensions\s*\{[^}]*requestPath[^}]*countryName[^}]*deviceType[^}]*refererHost/s);
  assert.match(request.query, /requestHost: "sphere-homotopy\.github\.io"/);
  assert.match(request.query, /bot: 0/);
  assert.match(request.query, /requestPath: "\/x_memes\/millionaire\/"/);
  assert.match(request.query, /requestPath: "\/x_memes\/go\/millionaire\/reddit\/"/);
  assert.match(request.query, /requestPath: "\/x_memes\/go\/millionaire\/hacker-news\/"/);
  assert.match(request.query, /requestPath: "\/x_memes\/go\/millionaire\/product-hunt\/"/);
  assert.match(request.query, /requestPath: "\/x_memes\/go\/kofi\/millionaire\/"/);
});

test('splitWindowByUtcDay prevents long ABR-prone Cloudflare queries', () => {
  assert.deepEqual(
    splitWindowByUtcDay('2026-09-01T18:00:00.000Z', '2026-09-03T06:00:00.000Z'),
    [
      { start: '2026-09-01T18:00:00.000Z', end: '2026-09-02T00:00:00.000Z' },
      { start: '2026-09-02T00:00:00.000Z', end: '2026-09-03T00:00:00.000Z' },
      { start: '2026-09-03T00:00:00.000Z', end: '2026-09-03T06:00:00.000Z' },
    ],
  );
});

test('validateGraphQLResponse rejects GraphQL errors instead of turning them into zero traffic', () => {
  assert.throws(
    () => validateGraphQLResponse({ data: null, errors: [{ message: 'permission denied' }] }),
    /permission denied/,
  );
});

test('buildSnapshot aggregates unsampled daily series into exact Millionaire metrics', () => {
  const response = (series) => ({
    data: { viewer: { accounts: [{ series }] } },
  });

  const responses = [
    response([
      {
        count: 3,
        avg: { sampleInterval: 1 },
        sum: { visits: 1 },
        dimensions: {
          requestPath: '/x_memes/millionaire/',
          countryName: 'RS',
          deviceType: 'desktop',
          refererHost: '',
        },
      },
      {
        count: 2,
        avg: { sampleInterval: 1 },
        sum: { visits: 1 },
        dimensions: {
          requestPath: '/x_memes/millionaire/',
          countryName: 'US',
          deviceType: 'mobile',
          refererHost: 'x.com',
        },
      },
      {
        count: 1,
        avg: { sampleInterval: 1 },
        sum: { visits: 1 },
        dimensions: {
          requestPath: '/x_memes/go/millionaire/product-hunt/',
          countryName: 'US',
          deviceType: 'desktop',
          refererHost: 'www.producthunt.com',
        },
      },
    ]),
    response([
      {
        count: 1,
        avg: { sampleInterval: 1 },
        sum: { visits: 1 },
        dimensions: {
          requestPath: '/x_memes/go/kofi/millionaire/',
          countryName: 'RS',
          deviceType: 'desktop',
          refererHost: 'sphere-homotopy.github.io',
        },
      },
    ]),
  ];

  const snapshot = buildSnapshot(responses, {
    generatedAt: '2026-09-03T05:00:00.000Z',
    start: '2026-09-01T00:00:00.000Z',
    end: '2026-09-03T05:00:00.000Z',
  });

  assert.equal(snapshot.pageviews, 5);
  assert.equal(snapshot.visits, 2);
  assert.equal(snapshot.sampling.exact, true);
  assert.equal(snapshot.sampling.maxSampleInterval, 1);
  assert.deepEqual(snapshot.acquisition, {
    redditPageviews: 0,
    hackerNewsPageviews: 0,
    productHuntPageviews: 1,
    kofiClickIntents: 1,
  });
  assert.deepEqual(snapshot.topReferrers, [
    { referrer: '(direct)', pageviews: 3 },
    { referrer: 'x.com', pageviews: 2 },
  ]);
  assert.deepEqual(snapshot.countries, [
    { country: 'RS', pageviews: 3 },
    { country: 'US', pageviews: 2 },
  ]);
  assert.deepEqual(snapshot.devices, [
    { device: 'desktop', pageviews: 3 },
    { device: 'mobile', pageviews: 2 },
  ]);
});

test('buildSnapshot fails closed when Cloudflare used adaptive sampling', () => {
  const sampled = {
    data: {
      viewer: {
        accounts: [{
          series: [{
            count: 50,
            avg: { sampleInterval: 10 },
            sum: { visits: 10 },
            dimensions: {
              requestPath: '/x_memes/millionaire/',
              countryName: 'RS',
              deviceType: 'desktop',
              refererHost: '',
            },
          }],
        }],
      },
    },
  };

  assert.throws(
    () => buildSnapshot([sampled], {
      generatedAt: '2026-09-03T05:00:00.000Z',
      start: '2026-09-02T00:00:00.000Z',
      end: '2026-09-03T00:00:00.000Z',
    }),
    /sampleInterval 10/,
  );
});

test('buildSnapshot rejects a response without exactly one account', () => {
  assert.throws(
    () => buildSnapshot([{ data: { viewer: { accounts: [] } } }], {
      generatedAt: '2026-09-03T05:00:00.000Z',
      start: '2026-09-02T00:00:00.000Z',
      end: '2026-09-03T00:00:00.000Z',
    }),
    /exactly one Cloudflare account/,
  );
});

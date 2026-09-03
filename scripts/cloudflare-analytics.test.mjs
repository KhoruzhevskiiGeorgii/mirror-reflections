import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGraphQLRequest,
  buildSnapshot,
  validateGraphQLResponse,
} from './cloudflare-analytics.mjs';

test('buildGraphQLRequest scopes data to the millionaire paths on the GitHub Pages host', () => {
  const request = buildGraphQLRequest({
    accountTag: 'acct',
    start: '2026-09-02T00:00:00Z',
    end: '2026-09-03T00:00:00Z',
  });

  assert.equal(request.variables.accountTag, 'acct');
  assert.deepEqual(request.variables.baseFilter.AND[1], { requestHost: 'sphere-homotopy.github.io' });
  assert.deepEqual(request.variables.baseFilter.AND[2], { bot: 0 });
  assert.match(request.query, /requestPath: "\/x_memes\/millionaire\/"/);
  assert.match(request.query, /requestPath: "\/x_memes\/go\/millionaire\/reddit\/"/);
  assert.match(request.query, /requestPath: "\/x_memes\/go\/millionaire\/hacker-news\/"/);
  assert.match(request.query, /requestPath: "\/x_memes\/go\/millionaire\/product-hunt\/"/);
  assert.match(request.query, /requestPath: "\/x_memes\/go\/kofi\/millionaire\/"/);
});

test('validateGraphQLResponse rejects GraphQL errors instead of turning them into zero traffic', () => {
  assert.throws(
    () => validateGraphQLResponse({ data: null, errors: [{ message: 'permission denied' }] }),
    /permission denied/,
  );
});

test('buildSnapshot preserves Cloudflare totals and acquisition counters', () => {
  const response = {
    data: {
      viewer: {
        accounts: [{
          total: [{ count: 27, sum: { visits: 15 } }],
          reddit: [{ count: 8, sum: { visits: 7 } }],
          hackerNews: [{ count: 3, sum: { visits: 3 } }],
          productHunt: [],
          kofi: [{ count: 2, sum: { visits: 2 } }],
          referrers: [
            { count: 9, dimensions: { refererHost: 'x.com' } },
            { count: 5, dimensions: { refererHost: 'www.reddit.com' } },
          ],
          countries: [{ count: 12, dimensions: { countryName: 'RS' } }],
          devices: [{ count: 20, dimensions: { deviceType: 'mobile' } }],
        }],
      },
    },
  };

  const snapshot = buildSnapshot(response, {
    generatedAt: '2026-09-03T05:00:00Z',
    start: '2026-09-02T00:00:00Z',
    end: '2026-09-03T00:00:00Z',
  });

  assert.equal(snapshot.pageviews, 27);
  assert.equal(snapshot.visits, 15);
  assert.deepEqual(snapshot.acquisition, {
    redditPageviews: 8,
    hackerNewsPageviews: 3,
    productHuntPageviews: 0,
    kofiClickIntents: 2,
  });
  assert.deepEqual(snapshot.topReferrers[0], { referrer: 'x.com', pageviews: 9 });
  assert.deepEqual(snapshot.countries[0], { country: 'RS', pageviews: 12 });
  assert.deepEqual(snapshot.devices[0], { device: 'mobile', pageviews: 20 });
});

test('buildSnapshot rejects a response without exactly one account', () => {
  assert.throws(
    () => buildSnapshot({ data: { viewer: { accounts: [] } } }, {
      generatedAt: '2026-09-03T05:00:00Z',
      start: '2026-09-02T00:00:00Z',
      end: '2026-09-03T00:00:00Z',
    }),
    /exactly one Cloudflare account/,
  );
});

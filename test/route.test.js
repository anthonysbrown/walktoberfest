import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialRoute, validateRoute, moveStop, directionsUrl } from '../src/route.js';
import handler from '../api/route.js';
test('validation rejects malformed, duplicate, and oversized stops', () => {
 assert.equal(validateRoute(initialRoute), true);
 assert.equal(validateRoute({ ...initialRoute, stops: [initialRoute.stops[0], initialRoute.stops[0]] }), false);
 assert.equal(validateRoute({ revision: -1, stops: [] }), false);
 assert.equal(validateRoute({ revision: 0, stops: [{ ...initialRoute.stops[0], host: ' ' }] }), false);
 assert.equal(validateRoute({ revision: 0, stops: [{ ...initialRoute.stops[0], address: 'a'.repeat(161) }] }), false);
});
test('moving a house preserves all stops and does not mutate original', () => {
 const stops = ['a','b','c'].map(id => ({ id }));
 assert.deepEqual(moveStop(stops, 'c', 0).map(s => s.id), ['c','a','b']);
 assert.deepEqual(moveStop(stops, 'a', 2).map(s => s.id), ['b','c','a']);
 assert.deepEqual(stops.map(s => s.id), ['a','b','c']);
});
test('walking directions retain route order and city', () => {
 const stops = ['15 Heroult Rd', '20 Heroult Rd', '25 Heroult Rd'].map(address => ({ address }));
 const params = new URL(directionsUrl(stops)).searchParams;
 assert.equal(params.get('travelmode'), 'walking');
 assert.equal(params.get('origin'), '15 Heroult Rd, Worcester, MA 01606');
 assert.equal(params.get('waypoints'), '20 Heroult Rd, Worcester, MA 01606');
 assert.equal(params.get('destination'), '25 Heroult Rd, Worcester, MA 01606');
 assert.equal(directionsUrl([]), '');
});
function response() { return { code: 0, body: null, setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } }; }
test('API reads and saves shared routes, rejects stale edits and invalid requests', async () => {
 const previousFetch = global.fetch;
 const oldUrl = process.env.KV_REST_API_URL, oldToken = process.env.KV_REST_API_TOKEN;
 process.env.KV_REST_API_URL = 'https://test.invalid'; process.env.KV_REST_API_TOKEN = 'test';
 let stored = null;
 global.fetch = async (_url, options) => {
  const command = JSON.parse(options.body); let result;
  if (command[0] === 'GET') result = stored;
  else { const revision = stored ? JSON.parse(stored).revision : 0; result = revision === Number(command[4]) ? 1 : 0; if (result) stored = command[5]; }
  return { ok: true, json: async () => ({ result }) };
 };
 try {
  let res = response(); await handler({ method: 'GET' }, res); assert.deepEqual(res.body, initialRoute);
  res = response(); await handler({ method: 'PUT', body: initialRoute }, res); assert.equal(res.code, 200); assert.equal(res.body.revision, 1);
  res = response(); await handler({ method: 'PUT', body: initialRoute }, res); assert.equal(res.code, 409);
  res = response(); await handler({ method: 'PUT', body: { revision: 1, stops: [{}] } }, res); assert.equal(res.code, 400);
  res = response(); await handler({ method: 'DELETE' }, res); assert.equal(res.code, 405);
 } finally { global.fetch = previousFetch; if (oldUrl === undefined) delete process.env.KV_REST_API_URL; else process.env.KV_REST_API_URL = oldUrl; if (oldToken === undefined) delete process.env.KV_REST_API_TOKEN; else process.env.KV_REST_API_TOKEN = oldToken; }
});

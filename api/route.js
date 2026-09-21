import { initialRoute, validateRoute } from '../src/route.js';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return res.status(503).json({ error: 'Shared route storage is not connected.', code: 'STORAGE_NOT_CONFIGURED' });
  async function redis(command) {
    const response = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(command), signal: AbortSignal.timeout(8000) });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error('Storage request failed');
    return data.result;
  }
  try {
    if (req.method === 'GET') {
      const saved = await redis(['GET', 'walktoberfest:route']);
      return res.status(200).json(saved ? JSON.parse(saved) : initialRoute);
    }
    if (req.method !== 'PUT') { res.setHeader('Allow', 'GET, PUT'); return res.status(405).json({ error: 'Method not allowed' }); }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!validateRoute(body)) return res.status(400).json({ error: 'Please check the house details. Maximum 30 stops.' });
    const next = { revision: body.revision + 1, stops: body.stops };
    const script = "local old = redis.call('GET', KEYS[1]); local revision = 0; if old then revision = cjson.decode(old).revision end; if revision ~= tonumber(ARGV[1]) then return 0 end; redis.call('SET', KEYS[1], ARGV[2]); return 1";
    const result = await redis(['EVAL', script, '1', 'walktoberfest:route', String(body.revision), JSON.stringify(next)]);
    if (!result) return res.status(409).json({ error: 'A neighbor updated the route. Please reload and try again.' });
    return res.status(200).json(next);
  } catch (error) { return res.status(error instanceof SyntaxError ? 400 : 502).json({ error: 'Could not save or load the route. Please try again.' }); }
}

import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS },
  });

const MAX_BODY = 2_000_000;      // ~2 MB of workout JSON is years of training
const MAX_TOMBSTONES = 5000;

const emptyDb = () => ({ unit: 'lb', entries: [], deleted: [], bodyweight: null });

function sanitize(db) {
  if (!db || typeof db !== 'object') return emptyDb();
  return {
    unit: db.unit === 'kg' ? 'kg' : 'lb',
    entries: Array.isArray(db.entries) ? db.entries.filter(e => e && typeof e.id === 'string') : [],
    deleted: Array.isArray(db.deleted) ? db.deleted.filter(d => typeof d === 'string') : [],
    // optional; the app uses it to score bodyweight and assisted exercises
    bodyweight: typeof db.bodyweight === 'number' && isFinite(db.bodyweight) && db.bodyweight > 0 ? db.bodyweight : null,
  };
}

// Union entries by id (client wins on conflict), minus everything tombstoned.
function merge(server, client) {
  const deleted = new Set([...server.deleted, ...client.deleted]);
  const byId = new Map();
  for (const e of server.entries) byId.set(e.id, e);
  for (const e of client.entries) byId.set(e.id, e);
  for (const id of deleted) byId.delete(id);
  const entries = [...byId.values()].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0
  );
  return {
    unit: client.unit || server.unit,
    bodyweight: client.bodyweight ?? server.bodyweight ?? null,
    entries,
    deleted: [...deleted].slice(-MAX_TOMBSTONES),
  };
}

export default async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const auth = req.headers.get('authorization') || '';
  let code = auth.replace(/^Bearer\s+/i, '').trim();
  // Read-only access with the code in the URL, e.g. /api/data?code=XXXX, so
  // tools that can only fetch a plain URL (an AI assistant, a browser tab)
  // can read the latest synced data without an Authorization header.
  if (!code && req.method === 'GET') {
    code = (new URL(req.url).searchParams.get('code') || '').trim();
  }
  if (code.length < 6) return json({ error: 'A sync code of at least 6 characters is required.' }, 401);
  const key = createHash('sha256').update(code).digest('hex');

  const store = getStore({ name: 'workouts', consistency: 'strong' });

  if (req.method === 'GET') {
    const data = await store.get(key, { type: 'json' });
    return json(data ?? emptyDb());
  }

  if (req.method === 'POST') {
    const text = await req.text();
    if (text.length > MAX_BODY) return json({ error: 'Payload too large.' }, 413);
    let client;
    try { client = sanitize(JSON.parse(text)); }
    catch { return json({ error: 'Invalid JSON.' }, 400); }
    const server = sanitize(await store.get(key, { type: 'json' }));
    const merged = merge(server, client);
    await store.setJSON(key, merged);
    return json(merged);
  }

  return json({ error: 'Method not allowed.' }, 405);
};

export const config = { path: '/api/data' };

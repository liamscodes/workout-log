// Local dev harness: serves public/ and runs the real data function against a
// real local Blobs server, mirroring how Netlify wires it up in production.
// Usage: node dev-server.mjs [port]   (default 8888)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { BlobsServer } from '@netlify/blobs/server';

const PORT = Number(process.argv[2]) || 8888;
const BLOBS_PORT = PORT + 1;

const blobs = new BlobsServer({
  directory: join(import.meta.dirname, '.blobs-data'),
  token: 'dev-token',
  port: BLOBS_PORT,
});
await blobs.start();
process.env.NETLIFY_BLOBS_CONTEXT = Buffer.from(JSON.stringify({
  edgeURL: `http://localhost:${BLOBS_PORT}`,
  uncachedEdgeURL: `http://localhost:${BLOBS_PORT}`, // required for strong-consistency reads
  token: 'dev-token',
  siteID: 'dev-site',
})).toString('base64');

const { default: handler } = await import('./netlify/functions/data.mjs');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname === '/api/data') {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : Buffer.concat(chunks),
    });
    const response = await handler(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
    return;
  }
  const path = url.pathname === '/' ? '/index.html' : url.pathname;
  try {
    const file = await readFile(join(import.meta.dirname, 'public', path));
    res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream' });
    res.end(file);
  } catch {
    res.writeHead(404); res.end('not found');
  }
}).listen(PORT, () => console.log(`dev server ready on http://localhost:${PORT}`));

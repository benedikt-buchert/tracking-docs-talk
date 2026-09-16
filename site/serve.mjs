// Zero-dependency dev server for the shop.
//   /            -> this folder (the shop)
//   /schemas/*   -> ../docs/static/schemas (read fresh from disk on every request)
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const schemas = path.resolve(here, '../docs/static/schemas');
const port = Number(process.env.PORT || 8000);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  let file;
  if (url.pathname.startsWith('/schemas/')) {
    file = path.join(schemas, url.pathname.slice('/schemas/'.length));
    if (!file.startsWith(schemas)) return res.writeHead(403).end();
  } else {
    file = path.join(here, url.pathname === '/' ? 'index.html' : url.pathname);
    if (!file.startsWith(here)) return res.writeHead(403).end();
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
}).listen(port, () => console.log(`🥨 Brezn Bude on http://localhost:${port}  (schemas from ${schemas})`));

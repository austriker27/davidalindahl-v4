#!/usr/bin/env node
// Tiny dev server that behaves like production:
// - rebuilds on every page load, so a refresh always shows the latest content/ and src/
// - applies public/_headers (CSP etc.), so policy problems show up locally
// - serves dist/404.html with a 404 status for unknown paths
// Usage: node scripts/dev.mjs [port]   (default 8787).

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const port = Number(process.argv[2]) || 8787;

const build = () => spawnSync(process.execPath, [join(root, 'scripts/build.mjs')], { stdio: 'inherit' });
build();

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

// Minimal _headers parser: "/path/*" blocks followed by indented "Name: value" lines.
async function headersFor(pathname) {
  const text = await readFile(join(dist, '_headers'), 'utf8').catch(() => '');
  const out = {};
  let applies = false;
  for (const line of text.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      const pattern = line.trim();
      applies = pattern.endsWith('*') ? pathname.startsWith(pattern.slice(0, -1)) : pathname === pattern;
    } else if (applies) {
      const i = line.indexOf(':');
      out[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
    }
  }
  delete out['strict-transport-security']; // meaningless over http://localhost
  return out;
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.endsWith('/') || url.pathname.endsWith('.html')) build();
  let file = normalize(join(dist, decodeURIComponent(url.pathname)));
  if (!file.startsWith(dist)) return res.writeHead(403).end();
  const headers = { 'cache-control': 'no-cache', ...(await headersFor(url.pathname)) };
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    res.writeHead(200, { ...headers, 'content-type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(await readFile(file));
  } catch {
    const notFound = await readFile(join(dist, '404.html')).catch(() => 'not found');
    res.writeHead(404, { ...headers, 'content-type': types['.html'] });
    res.end(notFound);
  }
}).listen(port, () => console.log(`→ http://localhost:${port}`));

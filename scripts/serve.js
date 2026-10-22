/**
 * serve.js: A tiny local web server for previewing and testing (no dependencies).
 *
 * Usage:     npm start            → http://localhost:4173
 *            PORT=5000 npm start  → custom port
 *            BASE_PATH=/digital-sorcery/ npm start → serve under a sub-folder, like GitHub Pages
 * Used by:   playwright.config.js (starts it automatically before browser tests).
 *
 * SECURITY: Only serves files inside the project folder. Requests that try to climb out
 * (e.g. /../../etc/passwd) or reach hidden files/folders (.git, .env) get a 404.
 * DEV NOTE: This is for local use only. Production hosting is GitHub Pages.
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.env.PORT) || 4173;
// Optional sub-folder, e.g. "/digital-sorcery/". Requests outside it get a 404, like GitHub Pages.
const BASE_PATH = process.env.BASE_PATH || '/';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

/** Map a URL path to a safe file path inside ROOT, or null if it is not allowed. */
function safePath(urlPath) {
  let decoded;
  try { decoded = decodeURIComponent(urlPath.split('?')[0]); } catch { return null; }
  if (decoded.includes('\0')) return null;
  const relative = normalize(decoded).replace(/^([/\\])+/, '');
  if (relative.split(/[/\\]/).some((part) => part.startsWith('.') && part !== '.')) return null;
  const full = resolve(join(ROOT, relative));
  if (full !== ROOT && !full.startsWith(ROOT + sep)) return null;
  if (full.startsWith(join(ROOT, 'node_modules'))) return null;
  return full;
}

const server = createServer(async (req, res) => {
  const url = req.url || '/';
  if (!url.startsWith(BASE_PATH)) { res.writeHead(404).end('Not found'); return; }
  let file = safePath(`/${url.slice(BASE_PATH.length)}`);
  if (!file) { res.writeHead(404).end('Not found'); return; }
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file)] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
});

server.listen(PORT, () => console.log(`Digital Sorcery running at http://localhost:${PORT}${BASE_PATH}`));

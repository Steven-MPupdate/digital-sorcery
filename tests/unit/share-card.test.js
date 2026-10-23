/**
 * share-card.test.js: Checks the social share card stays correct.
 * Run with: npm run test:unit
 * Depends on: index.html (the Open Graph / Twitter meta tags) and assets/social/og-image.png.
 *
 * DEV NOTE: social scrapers (iMessage, Discord, LinkedIn, Facebook, Slack, X) do not run
 * JavaScript and do not resolve relative paths, so every URL in those tags must be absolute
 * and the picture must really exist at the size the tags claim. This test guards all three.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = new URL('../../', import.meta.url);
const html = readFileSync(new URL('index.html', ROOT), 'utf8');

const SITE = 'https://digitalsorcery.butlerbuilds.dev/';
const EM_DASH = String.fromCodePoint(0x2014); // written as a code point: no em dashes in source

/**
 * The content of <meta property="KEY" content="..."> or <meta name="KEY" content="...">.
 * DEV NOTE: plain text search, not a regular expression, so the tags in index.html have to
 * stay in the one shape this project writes them in: property/name first, content second.
 * DEV NOTE: both attribute names are tried in full. Searching for the shared tail
 * `="description" content="` would also match `og:description`, and the "they must agree"
 * test below would then compare that tag with itself and guard nothing.
 */
function meta(key) {
  for (const attribute of ['property', 'name']) {
    const marker = `${attribute}="${key}" content="`;
    const at = html.indexOf(marker);
    if (at === -1) continue;
    const start = at + marker.length;
    return html.slice(start, html.indexOf('"', start));
  }
  return undefined;
}

/** Width and height read from a PNG's IHDR chunk (bytes 16 to 23). */
function pngSize(path) {
  const bytes = readFileSync(path);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test('the share card names every tag a link preview needs', () => {
  assert.equal(meta('og:type'), 'website');
  assert.equal(meta('og:site_name'), 'Butler Builds');
  assert.equal(meta('og:title'), 'Digital Sorcery');
  assert.equal(meta('twitter:card'), 'summary_large_image');
  for (const key of ['og:description', 'og:image:alt']) {
    assert.ok((meta(key) ?? '').length > 20, `${key} must say something`);
  }
});

test('every share URL is absolute and points at the live site', () => {
  for (const key of ['og:url', 'og:image']) {
    const value = meta(key) ?? '';
    assert.ok(value.startsWith(SITE), `${key} must start with ${SITE}, got "${value}"`);
  }
  assert.ok(html.includes(`<link rel="canonical" href="${SITE}">`), 'the canonical link is missing');
});

test('the picture exists and is the size the tags promise', () => {
  const name = (meta('og:image') ?? '').slice(SITE.length);
  const file = fileURLToPath(new URL(name, ROOT));
  assert.ok(statSync(file).isFile(), `${name} is missing: run "npm run og"`);

  const { width, height } = pngSize(file);
  assert.equal(String(width), meta('og:image:width'));
  assert.equal(String(height), meta('og:image:height'));
  // 1200x630 is the large-preview size every network accepts.
  assert.deepEqual({ width, height }, { width: 1200, height: 630 });
});

test('the share wording follows the studio rules', () => {
  // Studio rule: no em dashes in anything client-facing, and the card is as client-facing as it gets.
  for (const key of ['og:title', 'og:description', 'og:image:alt']) {
    assert.ok(!(meta(key) ?? '').includes(EM_DASH), `${key} must not contain an em dash`);
  }
  // The preview text should match the page's own description, so the two never drift.
  assert.equal(meta('og:description'), meta('description'));
  assert.ok((meta('og:description') ?? '').length > 20, 'og:description must say something');
});

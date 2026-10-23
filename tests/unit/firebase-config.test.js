/**
 * firebase-config.test.js: Checks firebase.json, the Firebase Hosting settings.
 * Run with: npm run test:unit
 * Depends on: firebase.json (read as plain JSON, no Firebase tools needed).
 * DEV NOTE: Firebase matches header rules against the address asked for, not the file it
 * serves, so "/index.html" does not cover "/". The home page went out with a 1-hour browser
 * cache on the first Firebase release (2026-10-22); this test keeps every app-shell address fresh.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync(new URL('../../firebase.json', import.meta.url), 'utf8'));

/** The Cache-Control value firebase.json sets for exactly this source, or undefined. */
function cacheControlFor(source) {
  const rule = config.hosting.headers.find((entry) => entry.source === source);
  return rule?.headers.find((header) => header.key === 'Cache-Control')?.value;
}

test('the page, service worker and manifest are never served from the browser cache', () => {
  for (const source of ['/', '/index.html', '/sw.js', '/manifest.webmanifest', '/src/**']) {
    assert.match(cacheControlFor(source) ?? '', /no-cache/, `${source} must be no-cache`);
  }
});

test('the share card and the icons are cached for a day', () => {
  // The share picture is read by social networks, not by the app, so a day of caching is fine.
  // It is also why a changed card needs the networks re-scraped (docs/handoff/DEPLOY.md).
  for (const source of ['/assets/social/**', '/assets/icons/**']) {
    assert.equal(cacheControlFor(source), 'public, max-age=86400', `${source} must be cached for a day`);
  }
});

test('firebase.json only holds Hosting settings for this one site', () => {
  // SECURITY: the site lives in the shared mp-soul-stats project (DECISIONS D20), so this repo
  // must never carry Firestore rules, functions or storage settings that a publish could push.
  assert.deepEqual(Object.keys(config), ['hosting']);
  assert.equal(config.hosting.site, 'digital-sorcery-butlerbuilds');
  assert.equal(config.hosting.public, '_site');
});

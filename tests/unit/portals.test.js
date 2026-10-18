/**
 * portals.test.js — Checks the Portals list is safe and complete.
 * Run with: npm run test:unit
 * Depends on: src/portals.js.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PORTALS, PORTAL_GROUPS } from '../../src/portals.js';

// SECURITY: the only sites a portal may open. Adding a portal means adding its host here,
// on purpose, so a typo or a lookalike domain can't slip in.
const ALLOWED_PORTAL_HOSTS = new Set(['claude.ai', 'chatgpt.com', 'gemini.google.com', 'bolt.new', 'lovable.dev']);

test('portals: every URL is a fixed https address on an allowed host, with no query or fragment', () => {
  for (const portal of PORTALS) {
    const url = new URL(portal.url);
    assert.equal(url.protocol, 'https:', portal.id);
    assert.ok(ALLOWED_PORTAL_HOSTS.has(url.hostname), `${portal.id}: host ${url.hostname} is not on the allowlist`);
    assert.equal(url.search, '', `${portal.id}: never put the spell in the link (DECISIONS D16)`);
    assert.equal(url.hash, '', `${portal.id}: no #fragments either`);
    assert.equal(url.username + url.password, '', portal.id);
  }
});

test('portals: ids are unique and every portal belongs to a known group', () => {
  assert.equal(new Set(PORTALS.map((p) => p.id)).size, PORTALS.length);
  for (const portal of PORTALS) assert.ok(PORTAL_GROUPS[portal.kind], portal.id);
  for (const kind of Object.keys(PORTAL_GROUPS)) assert.ok(PORTALS.some((p) => p.kind === kind), kind);
});

test('portals: the lists cannot be changed while the app runs', () => {
  assert.ok(Object.isFrozen(PORTALS));
  assert.ok(PORTALS.every((p) => Object.isFrozen(p)));
  assert.ok(Object.isFrozen(PORTAL_GROUPS));
});

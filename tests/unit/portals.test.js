/**
 * portals.test.js — Checks the Portals list is safe and complete.
 * Run with: npm run test:unit
 * Depends on: src/portals.js.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PORTALS, PORTAL_GROUPS } from '../../src/portals.js';

test('portals: every URL is a fixed https address with no query string', () => {
  for (const portal of PORTALS) {
    const url = new URL(portal.url);
    assert.equal(url.protocol, 'https:', portal.id);
    assert.equal(url.search, '', `${portal.id}: never put the spell in the link (DECISIONS D16)`);
    assert.equal(url.username + url.password, '', portal.id);
  }
});

test('portals: ids are unique and every portal belongs to a known group', () => {
  assert.equal(new Set(PORTALS.map((p) => p.id)).size, PORTALS.length);
  for (const portal of PORTALS) assert.ok(PORTAL_GROUPS[portal.kind], portal.id);
  for (const kind of Object.keys(PORTAL_GROUPS)) assert.ok(PORTALS.some((p) => p.kind === kind), kind);
});

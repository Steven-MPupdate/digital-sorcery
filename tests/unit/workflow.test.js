/**
 * workflow.test.js: Checks .github/workflows/ci-deploy.yml, which only runs the tests.
 * Run with: npm run test:unit
 * Depends on: the workflow file, read as plain text (no YAML library in this project).
 *
 * DEV NOTE: the GitHub Pages job published a second live copy of the whole app, which answered
 * with none of the security headers in firebase.json. It was deleted on 2026-10-23 (DECISIONS
 * D23) and the site has one home: digitalsorcery.butlerbuilds.dev. This test is the guard, so
 * a copied workflow or a hopeful edit cannot quietly put a second public copy back.
 * Since 2026-10-25 GitHub is only the code backup (D26): the dormant Firebase job is gone too,
 * so the workflow must publish nothing at all.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(
  new URL('../../.github/workflows/ci-deploy.yml', import.meta.url),
  'utf8',
);

/**
 * The workflow without its comments, so the notes explaining why Pages is gone are not
 * mistaken for the thing they describe.
 */
const settings = workflow
  .split(/\r?\n/)
  .filter((line) => !line.trim().startsWith('#'))
  .join('\n');

/** The names of the jobs: lines under `jobs:` indented two spaces and ending in a colon. */
function jobNames() {
  const jobs = settings.slice(settings.indexOf('\njobs:'));
  return jobs
    .split('\n')
    .map((line) => line.match(/^ {2}([a-z0-9][a-z0-9-]*):\s*$/i))
    .filter(Boolean)
    .map((match) => match[1]);
}

test('the workflow only runs the tests: GitHub is the backup, not a publisher (D26)', () => {
  assert.deepEqual(jobNames(), ['test']);
  // SECURITY: no Firebase key and no publish command may come back into GitHub.
  for (const marker of ['FIREBASE_SERVICE_ACCOUNT', 'firebase-tools', 'secrets.']) {
    assert.ok(!settings.includes(marker), `${marker} must not come back (DECISIONS D26)`);
  }
});

test('nothing in the workflow publishes to GitHub Pages', () => {
  // The header comment explains why Pages is gone, so only the action and permission names
  // are forbidden, not the word itself.
  for (const marker of ['configure-pages', 'upload-pages-artifact', 'deploy-pages', 'github-pages']) {
    assert.ok(!settings.includes(marker), `${marker} must not come back (DECISIONS D23)`);
  }
});

test('the workflow asks for no more rights than reading the code', () => {
  // SECURITY: with Pages gone, no job needs to write anywhere or mint an identity token.
  for (const permission of ['pages: write', 'id-token: write']) {
    assert.ok(!settings.includes(permission), `${permission} is no longer needed`);
  }
  assert.ok(settings.includes('permissions:\n  contents: read'), 'the default must stay contents: read');
});

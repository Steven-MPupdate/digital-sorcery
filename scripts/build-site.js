// build-site.js — Collect only the files the website needs into `_site/`.
//
// What it does: deletes `_site/`, then copies the shipping files (index.html,
// manifest.webmanifest, sw.js, src/, assets/) into it and adds `.nojekyll`.
// Depends on: Node's built-in `fs` and `path` only. No build step, no dependencies.
// Called by: `npm run build:site`, the GitHub Pages job and the Firebase Hosting job
// in `.github/workflows/ci-deploy.yml`, and anyone deploying by hand.
//
// DEV NOTE: both hosts deploy the SAME folder, so the two sites can never drift.
// SECURITY: an allow-list, not an ignore-list. Docs, tests, .claude/ and node_modules
// can never reach the public site by accident, even if someone adds new folders.

import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, '_site');

// Exactly what the browser needs. Add a line here if the app gains a new shipping file.
const SHIPPING_FILES = ['index.html', 'manifest.webmanifest', 'sw.js'];
const SHIPPING_FOLDERS = ['src', 'assets'];

async function buildSite() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  for (const file of SHIPPING_FILES) {
    await cp(path.join(ROOT, file), path.join(OUT, file));
  }
  for (const folder of SHIPPING_FOLDERS) {
    await cp(path.join(ROOT, folder), path.join(OUT, folder), { recursive: true });
  }

  // DEV NOTE: .nojekyll tells GitHub Pages to serve files as-is (no Jekyll processing).
  // Firebase ignores it; one extra empty file is cheaper than two different builds.
  await writeFile(path.join(OUT, '.nojekyll'), '');

  const shipped = [...SHIPPING_FILES, ...SHIPPING_FOLDERS].join(', ');
  console.log(`Built _site/ with: ${shipped}, .nojekyll`);
}

buildSite().catch((error) => {
  console.error('Could not build _site/:', error.message);
  process.exitCode = 1;
});

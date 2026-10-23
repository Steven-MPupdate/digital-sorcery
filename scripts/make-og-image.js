/**
 * make-og-image.js: Renders scripts/og-card.html into the social share picture.
 *
 * Usage:   npm run og   (re-run after editing og-card.html or brand.css, then commit the PNG)
 * Output:  assets/social/og-image.png, 1200x630, the size Facebook, LinkedIn, Discord,
 *          iMessage, WhatsApp and X all use for a large link preview.
 * Depends on: the Playwright Chromium already installed for the tests, so no image library.
 *             All colors and fonts come from src/styles/brand.css through og-card.html.
 * Called by:  a person (or an agent) by hand. It is not part of `npm test` or any deploy,
 *             because the PNG is committed to the repo.
 *
 * DEV NOTE: the page is opened over file:// so the card's relative paths to brand.css,
 * the fonts and the icon all resolve with no server running.
 */

import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const WIDTH = 1200;
const HEIGHT = 630;

const cardUrl = new URL('og-card.html', import.meta.url);
const outDir = new URL('../assets/social/', import.meta.url);
const outFile = new URL('og-image.png', outDir);

await mkdir(fileURLToPath(outDir), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
await page.goto(cardUrl.href);
// Wait for the self-hosted fonts, or the card can be shot in a fallback typeface.
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: fileURLToPath(outFile), clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });

await browser.close();
console.log(`Share card written to assets/social/og-image.png (${WIDTH}x${HEIGHT})`);

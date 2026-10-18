/**
 * make-icons.js — Renders assets/icons/icon.svg into the PNG sizes phones need.
 *
 * Usage:   npm run icons   (re-run after editing icon.svg)
 * Output:  icon-192.png, icon-512.png, icon-maskable-512.png (with safe-zone padding).
 * DEV NOTE: Uses the Playwright Chromium already installed for tests, so no image library.
 */

import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const dir = new URL('../assets/icons/', import.meta.url);
const svg = await readFile(new URL('icon.svg', dir), 'utf8');
const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

const browser = await chromium.launch();
const page = await browser.newPage();

async function render(size, fileName, padding = 0) {
  await page.setViewportSize({ width: size, height: size });
  const inner = size - padding * 2;
  await page.setContent(
    `<body style="margin:0;background:#0E0D0B;display:grid;place-items:center;width:${size}px;height:${size}px">` +
    `<img src="${dataUrl}" width="${inner}" height="${inner}"></body>`,
  );
  await page.screenshot({ path: new URL(fileName, dir).pathname });
}

await render(192, 'icon-192.png');
await render(512, 'icon-512.png');
// Maskable icons get cropped into circles/squircles; keep the art inside the middle 80%.
await render(512, 'icon-maskable-512.png', 52);

await browser.close();
console.log('Icons written to assets/icons/');
